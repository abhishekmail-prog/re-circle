package com.recircle.service;

import com.recircle.dto.CreateLotRequest;
import com.recircle.entity.MaterialCategory;
import com.recircle.entity.MaterialLot;
import com.recircle.entity.Recycler;
import com.recircle.entity.User;
import com.recircle.repository.MaterialCategoryRepository;
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
import java.util.Map;
import java.util.UUID;

@Service
@Transactional
public class LotService {

    private static final Logger logger = LoggerFactory.getLogger(LotService.class);

    @Autowired
    private MaterialLotRepository lotRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MaterialCategoryRepository categoryRepository;

    @Autowired
    private RecyclerRepository recyclerRepository;

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    public MaterialLot createLot(String userEmail, CreateLotRequest request) {
        User collector = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));

        MaterialCategory category = categoryRepository.findByName(request.getMaterialCategoryName())
            .orElseThrow(() -> new RuntimeException("Material category not found"));

        MaterialLot lot = new MaterialLot();
        lot.setCollector(collector);
        lot.setMaterialCategory(category);
        lot.setDescription(request.getDescription());
        lot.setWeightKg(request.getWeightKg());
        lot.setCondition(request.getCondition());
        lot.setSourceType(request.getSourceType());
        lot.setCollectionLatitude(request.getCollectionLatitude());
        lot.setCollectionLongitude(request.getCollectionLongitude());
        lot.setCollectionAddress(request.getCollectionAddress());

        // Save all image URLs (up to 10) and set the first as the primary
        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            java.util.List<String> urls = request.getImageUrls().stream()
                .filter(u -> u != null && !u.isBlank())
                .limit(10)
                .collect(java.util.stream.Collectors.toList());
            if (!urls.isEmpty()) {
                lot.setImageUrls(String.join(",", urls));
                lot.setImageUrl(urls.get(0));
            }
        } else if (request.getImageUrl() != null && !request.getImageUrl().isBlank()) {
            // backward compat: single image URL
            lot.setImageUrl(request.getImageUrl());
            lot.setImageUrls(request.getImageUrl());
        }

        // Every lot becomes an auction with a 24h window
        lot.setAuctionEndsAt(java.time.LocalDateTime.now().plusHours(24));
        lot.setStatus(MaterialLot.LotStatus.BIDDING);

        MaterialLot saved = lotRepository.save(lot);
        broadcastLotEvent("LOT_CREATED", saved);
        return saved;
    }

    public List<MaterialLot> getLotsByCollector(String userEmail) {
        User collector = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return lotRepository.findByCollectorOrderByCreatedAtDesc(collector);
    }

    public MaterialLot getLotByLotId(String lotId) {
        return lotRepository.findByLotId(lotId)
            .orElseThrow(() -> new RuntimeException("Lot not found: " + lotId));
    }

    public List<MaterialLot> getAllLots() {
        return lotRepository.findAll();
    }

    public MaterialLot selectRecycler(String lotId, String recyclerId) {
        MaterialLot lot = getLotByLotId(lotId);

        if (recyclerId != null && !recyclerId.isBlank()) {
            try {
                UUID uuid = UUID.fromString(recyclerId);
                recyclerRepository.findById(uuid).ifPresent(lot::setSelectedRecycler);
            } catch (IllegalArgumentException e) {
                logger.warn("Demo recycler id '{}' — skipping DB lookup", recyclerId);
            }
        }

        lot.setStatus(MaterialLot.LotStatus.MATCHED);

        if (lot.getEstimatedValue() != null) {
            double transportCost = 200;
            lot.setTransportCost(transportCost);
            lot.setNetEarnings(lot.getEstimatedValue() - transportCost);
        }

        return lotRepository.save(lot);
    }

    public MaterialLot updateLotStatus(String lotId, MaterialLot.LotStatus status) {
        MaterialLot lot = getLotByLotId(lotId);
        lot.setStatus(status);
        return lotRepository.save(lot);
    }

    public List<MaterialLot> getPendingHandoversForRecycler(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        Recycler recycler = recyclerRepository.findByUser(user)
            .orElseThrow(() -> new RuntimeException("Recycler profile not found"));

        // Return ALL lots assigned to this recycler — the frontend needs
        // paid + pending together to compute correct totals.
        return lotRepository.findBySelectedRecyclerAndStatusInOrderByCreatedAtDesc(
            recycler,
            List.of(
                MaterialLot.LotStatus.MATCHED,
                MaterialLot.LotStatus.HANDED_OVER,
                MaterialLot.LotStatus.PAYMENT_PENDING,
                MaterialLot.LotStatus.PAID,
                MaterialLot.LotStatus.COMPLETED
            )
        );
    }

    public MaterialLot confirmHandover(String lotId, String email, Map<String, Object> body) {
        MaterialLot lot = getLotByLotId(lotId);
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        Recycler recycler = recyclerRepository.findByUser(user)
            .orElseThrow(() -> new RuntimeException("Recycler profile not found"));

        // Only the assigned recycler can confirm
        if (lot.getSelectedRecycler() == null
                || !lot.getSelectedRecycler().getId().equals(recycler.getId())) {
            throw new RuntimeException("This lot is not assigned to you");
        }

        // Parse body
        Object vw = body.get("verifiedWeight");
        Object fp = body.get("finalPrice");
        String paymentStatus = (String) body.getOrDefault("paymentStatus", "PAID");
        String paymentMethod = (String) body.getOrDefault("paymentMethod", "CASH");

        if (vw != null) {
            lot.setVerifiedWeightKg(Double.parseDouble(vw.toString()));
        }
        if (fp != null) {
            double finalVal = Double.parseDouble(fp.toString());
            lot.setFinalValue(finalVal);
            if (lot.getVerifiedWeightKg() != null && lot.getVerifiedWeightKg() > 0) {
                lot.setFinalPricePerKg(finalVal / lot.getVerifiedWeightKg());
            }
        }

        // Recompute net earnings
        double transport = lot.getTransportCost() != null ? lot.getTransportCost() : 200.0;
        lot.setTransportCost(transport);
        if (lot.getFinalValue() != null) {
            lot.setNetEarnings(lot.getFinalValue() - transport);
        }

        if ("PAID".equalsIgnoreCase(paymentStatus)) {
            lot.setStatus(MaterialLot.LotStatus.PAID);
            lot.setCompletedAt(java.time.LocalDateTime.now());
        } else {
            lot.setStatus(MaterialLot.LotStatus.PAYMENT_PENDING);
        }
        lot.setPaymentMethod(paymentMethod);
        lot.setHandoverAt(java.time.LocalDateTime.now());

        logger.info("Handover confirmed for {} by recycler {}", lotId, email);
        MaterialLot saved = lotRepository.save(lot);
        broadcastLotEvent("LOT_UPDATED", saved);
        return saved;
    }

    private void broadcastLotEvent(String event, MaterialLot lot) {
        if (messagingTemplate == null) return;
        try {
            messagingTemplate.convertAndSend("/topic/lots", java.util.Map.of(
                "event", event,
                "lotId", lot.getLotId(),
                "status", lot.getStatus() != null ? lot.getStatus().toString() : ""
            ));
        } catch (Exception e) {
            logger.warn("Lot broadcast failed for {}: {}", lot.getLotId(), e.getMessage());
        }
    }
}
