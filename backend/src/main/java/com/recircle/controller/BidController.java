package com.recircle.controller;

import com.recircle.dto.BidRequest;
import com.recircle.entity.Bid;
import com.recircle.entity.MaterialLot;
import com.recircle.service.BidService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/lots/{lotId}/bids")
public class BidController {

    @Autowired
    private BidService bidService;

    @PostMapping
    public ResponseEntity<?> placeBid(@PathVariable String lotId,
                                      @RequestBody BidRequest req,
                                      Principal principal) {
        try {
            Bid bid = bidService.placeBid(lotId, principal.getName(), req);
            return ResponseEntity.ok(bid);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getBids(@PathVariable String lotId) {
        try {
            List<Bid> bids = bidService.getBids(lotId);
            return ResponseEntity.ok(bids);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{bidId}/accept")
    public ResponseEntity<?> acceptBid(@PathVariable String lotId,
                                       @PathVariable String bidId,
                                       Principal principal) {
        try {
            MaterialLot lot = bidService.acceptBid(
                lotId, UUID.fromString(bidId), principal.getName()
            );
            return ResponseEntity.ok(lot);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
