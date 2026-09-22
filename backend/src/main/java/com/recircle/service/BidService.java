package com.recircle.service;

import com.recircle.dto.BidRequest;
import com.recircle.entity.Bid;
import com.recircle.entity.MaterialLot;
import com.recircle.entity.Recycler;
import com.recircle.entity.User;
import com.recircle.repository.BidRepository;
import com.recircle.repository.MaterialLotRepository;
import com.recircle.repository.RecyclerRepository;
import com.recircle.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class BidService {

    private static final Logger logger = LoggerFactory.getLogger(BidService.class);

    @Autowired private BidRepository bidRepository;
    @Autowired private MaterialLotRepository lotRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private RecyclerRepository recyclerRepository;
    @Autowired private SimpMessagingTemplate messagingTemplate;

    /**
     * A recycler submits a bid on a lot.
     */
    public Bid placeBid(String lotId, String recyclerEmail, BidRequest req) {
        MaterialLot lot = lotRepository.findByLotId(lotId)
            .orElseThrow(() -> new RuntimeException("Lot not found: " + lotId));

        if (lot.getStatus() != MaterialLot.LotStatus.CREATED
                && lot.getStatus() != MaterialLot.LotStatus.BIDDING) {
            throw new RuntimeException("Lot is not open for bidding (status: " + lot.getStatus() + ")");
        }

        if (lot.getAuctionEndsAt() != null
                && java.time.LocalDateTime.now().isAfter(lot.getAuctionEndsAt())) {
            throw new RuntimeException("Auction has ended");
        }

        if (req.getAmountPerKg() == null || req.getAmountPerKg() <= 0) {
            throw new RuntimeException("amountPerKg must be positive");
        }

        // Strictly increasing bids: new bid must beat the current highest
        List<Bid> existing = bidRepository.findByLotOrderByAmountPerKgDesc(lot);
        if (!existing.isEmpty()) {
            double highest = existing.get(0).getAmountPerKg();
            if (req.getAmountPerKg() <= highest) {
                throw new RuntimeException(
                    String.format("Minimum bid is ₹%.0f/kg — must be higher than the current top bid", highest + 1)
                );
            }
        }

        User user = userRepository.findByEmail(recyclerEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        Recycler recycler = recyclerRepository.findByUser(user)
            .orElseThrow(() -> new RuntimeException("Recycler profile not found"));

        // One bid per recycler per lot — update if re-bidding
        Bid bid = bidRepository.findByLotAndRecycler(lot, recycler)
            .orElseGet(Bid::new);

        bid.setLot(lot);
        bid.setRecycler(recycler);
        bid.setAmountPerKg(req.getAmountPerKg());
        bid.setTotalAmount(req.getAmountPerKg() * lot.getWeightKg());
        bid.setStatus(Bid.BidStatus.PENDING);
        Bid saved = bidRepository.save(bid);

        // Move lot into BIDDING on the first bid
        if (lot.getStatus() == MaterialLot.LotStatus.CREATED) {
            lot.setStatus(MaterialLot.LotStatus.BIDDING);
            lotRepository.save(lot);
        }

        // Push live to anyone watching this lot
        messagingTemplate.convertAndSend(
            "/topic/lots/" + lotId + "/bids",
            saved
        );

        logger.info("Bid placed on {} by {}: {} /kg", lotId, recyclerEmail, req.getAmountPerKg());
        return saved;
    }

    /**
     * Anyone authenticated can see the bids on a lot.
     */
    public List<Bid> getBids(String lotId) {
        MaterialLot lot = lotRepository.findByLotId(lotId)
            .orElseThrow(() -> new RuntimeException("Lot not found: " + lotId));
        return bidRepository.findByLotOrderByAmountPerKgDesc(lot);
    }

    /**
     * Collector accepts a bid. Marks it ACCEPTED, rejects the rest,
     * moves the lot to MATCHED, and sets the final price.
     */
    public MaterialLot acceptBid(String lotId, UUID bidId, String collectorEmail) {
        MaterialLot lot = lotRepository.findByLotId(lotId)
            .orElseThrow(() -> new RuntimeException("Lot not found: " + lotId));

        if (lot.getCollector() == null
                || !lot.getCollector().getEmail().equals(collectorEmail)) {
            throw new RuntimeException("Only the lot's collector can accept a bid");
        }

        Bid winner = bidRepository.findByIdAndLot(bidId, lot)
            .orElseThrow(() -> new RuntimeException("Bid not found on this lot"));

        if (winner.getStatus() != Bid.BidStatus.PENDING) {
            throw new RuntimeException("This bid is no longer pending");
        }

        // Accept winner
        winner.setStatus(Bid.BidStatus.ACCEPTED);
        bidRepository.save(winner);

        // Reject the rest
        for (Bid b : bidRepository.findByLotAndStatus(lot, Bid.BidStatus.PENDING)) {
            if (!b.getId().equals(winner.getId())) {
                b.setStatus(Bid.BidStatus.REJECTED);
                bidRepository.save(b);
            }
        }

        // Move lot to MATCHED
        lot.setStatus(MaterialLot.LotStatus.MATCHED);
        lot.setSelectedRecycler(winner.getRecycler());
        lot.setOfferedPricePerKg(winner.getAmountPerKg());
        lot.setEstimatedValue(winner.getTotalAmount());

        MaterialLot saved = lotRepository.save(lot);

        // Push the acceptance to everyone watching this lot
        messagingTemplate.convertAndSend(
            "/topic/lots/" + lotId + "/bids",
            java.util.Map.of("event", "ACCEPTED", "bidId", bidId.toString())
        );

        logger.info("Bid {} accepted on lot {} by collector {}", bidId, lotId, collectorEmail);
        return saved;
    }


    /** Collector manually closes the auction — highest bid wins immediately. */
    public MaterialLot closeAuction(String lotId, String collectorEmail) {
        MaterialLot lot = lotRepository.findByLotId(lotId)
            .orElseThrow(() -> new RuntimeException("Lot not found: " + lotId));

        if (lot.getCollector() == null
                || !lot.getCollector().getEmail().equals(collectorEmail)) {
            throw new RuntimeException("Only the lot's collector can close the auction");
        }

        return finalizeAuction(lot);
    }

    /** Scheduler-driven close for auctions past their end time. Returns count closed. */
    public int closeAllExpiredAuctions() {
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        var expired = lotRepository.findByAuctionEndsAtBeforeAndStatus(
            now, MaterialLot.LotStatus.BIDDING
        );
        int closed = 0;
        for (MaterialLot lot : expired) {
            try {
                finalizeAuction(lot);
                closed++;
            } catch (Exception e) {
                logger.warn("Failed to finalize auction for {}: {}", lot.getLotId(), e.getMessage());
            }
        }
        return closed;
    }

    /** Core: pick top bid, accept it, reject others, mark lot MATCHED. */
    private MaterialLot finalizeAuction(MaterialLot lot) {
        if (lot.getStatus() != MaterialLot.LotStatus.BIDDING
                && lot.getStatus() != MaterialLot.LotStatus.CREATED) {
            throw new RuntimeException("Lot is not in an open auction state");
        }

        List<Bid> bids = bidRepository.findByLotOrderByAmountPerKgDesc(lot);
        if (bids.isEmpty()) {
            // No bids — close the auction by deleting the lot entirely.
            String lotId = lot.getLotId();
            lotRepository.delete(lot);
            logger.info("Auction closed with no bids — deleted lot {}", lotId);
            broadcastLotEvent("LOT_DELETED", lotId);
            return null;
        }

        Bid winner = bids.get(0);
        winner.setStatus(Bid.BidStatus.ACCEPTED);
        bidRepository.save(winner);

        for (Bid b : bids) {
            if (!b.getId().equals(winner.getId())
                    && b.getStatus() == Bid.BidStatus.PENDING) {
                b.setStatus(Bid.BidStatus.REJECTED);
                bidRepository.save(b);
            }
        }

        lot.setStatus(MaterialLot.LotStatus.MATCHED);
        lot.setSelectedRecycler(winner.getRecycler());
        lot.setOfferedPricePerKg(winner.getAmountPerKg());
        lot.setEstimatedValue(winner.getTotalAmount());
        MaterialLot saved = lotRepository.save(lot);

        messagingTemplate.convertAndSend(
            "/topic/lots/" + lot.getLotId() + "/bids",
            java.util.Map.of(
                "event", "ACCEPTED",
                "bidId", winner.getId().toString(),
                "reason", "AUCTION_CLOSED"
            )
        );

        // Also broadcast to the global lot topic so any recycler list
        // currently mounted can refetch.
        try {
            messagingTemplate.convertAndSend("/topic/lots", java.util.Map.of(
                "event", "LOT_UPDATED",
                "lotId", lot.getLotId(),
                "status", lot.getStatus().toString()
            ));
        } catch (Exception e) {
            logger.warn("Lot broadcast failed: {}", e.getMessage());
        }

        logger.info("Auction closed for {} — winner {} @ {} /kg",
            lot.getLotId(), winner.getRecycler().getCompanyName(), winner.getAmountPerKg());
        return saved;
    }

    private void broadcastLotEvent(String event, String lotId) {
        try {
            messagingTemplate.convertAndSend("/topic/lots", java.util.Map.of(
                "event", event,
                "lotId", lotId
            ));
        } catch (Exception e) {
            logger.warn("Broadcast failed: {}", e.getMessage());
        }
    }
}
