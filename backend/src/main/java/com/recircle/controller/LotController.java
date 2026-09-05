package com.recircle.controller;

import com.recircle.dto.CreateLotRequest;
import com.recircle.entity.MaterialLot;
import com.recircle.service.LotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/lots")
public class LotController {
    @Autowired
    private LotService lotService;

    @PostMapping
    public ResponseEntity<?> createLot(@RequestBody CreateLotRequest request, Authentication authentication) {
        try {
            System.out.println("📝 Creating lot with data: " + request);
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            System.out.println("👤 User: " + userDetails.getUsername());
            MaterialLot lot = lotService.createLot(userDetails.getUsername(), request);
            System.out.println("✅ Lot created: " + lot.getLotId());
            
            // Return the full lot object
            return ResponseEntity.ok(lot);
        } catch (Exception e) {
            System.err.println("❌ Error creating lot: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping
    public ResponseEntity<?> getMyLots(Authentication authentication) {
        try {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            List<MaterialLot> lots = lotService.getLotsByCollector(userDetails.getUsername());
            return ResponseEntity.ok(lots);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to fetch lots: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getLotById(@PathVariable String id) {
        try {
            System.out.println("🔍 Fetching lot by ID: " + id);
            MaterialLot lot = lotService.getLotByLotId(id);
            System.out.println("✅ Found lot: " + lot.getLotId());
            return ResponseEntity.ok(lot);
        } catch (Exception e) {
            System.err.println("❌ Error fetching lot: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Lot not found: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/select-recycler")
    public ResponseEntity<?> selectRecycler(@PathVariable String id, @RequestBody Map<String, String> request) {
        try {
            System.out.println("🔍 Selecting recycler for lot: " + id);
            String recyclerId = request.get("recyclerId");
            if (recyclerId == null || recyclerId.isEmpty()) {
                return ResponseEntity.badRequest().body("recyclerId is required");
            }
            
            MaterialLot lot = lotService.selectRecycler(id, recyclerId);
            System.out.println("✅ Recycler selected for lot: " + lot.getLotId());
            return ResponseEntity.ok(lot);
        } catch (Exception e) {
            System.err.println("❌ Error selecting recycler: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Failed to select recycler: " + e.getMessage());
        }
    }
}
