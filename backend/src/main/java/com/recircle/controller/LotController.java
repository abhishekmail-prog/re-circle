package com.recircle.controller;

import com.recircle.dto.CreateLotRequest;
import com.recircle.entity.MaterialLot;
import com.recircle.service.LotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/lots")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class LotController {
    @Autowired
    private LotService lotService;

    @PostMapping
    public ResponseEntity<?> createLot(@RequestBody CreateLotRequest request, Authentication authentication) {
        try {
            System.out.println("📝 Creating lot with data: " + request);
            
            if (authentication == null) {
                System.err.println("❌ Authentication is null");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Authentication required");
            }
            
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            System.out.println("👤 User: " + userDetails.getUsername());
            
            MaterialLot lot = lotService.createLot(userDetails.getUsername(), request);
            System.out.println("✅ Lot created: " + lot.getLotId());
            
            return ResponseEntity.ok(lot);
        } catch (Exception e) {
            System.err.println("❌ Error creating lot: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
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
            MaterialLot lot = lotService.getLotByLotId(id);
            return ResponseEntity.ok(lot);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lot not found: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/select-recycler")
    public ResponseEntity<?> selectRecycler(@PathVariable String id, @RequestBody Map<String, String> request) {
        try {
            String recyclerId = request.get("recyclerId");
            if (recyclerId == null || recyclerId.isEmpty()) {
                return ResponseEntity.badRequest().body("recyclerId is required");
            }
            
            MaterialLot lot = lotService.selectRecycler(id, recyclerId);
            return ResponseEntity.ok(lot);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Failed to select recycler: " + e.getMessage());
        }
    }
}
