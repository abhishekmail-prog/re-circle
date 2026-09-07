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
@CrossOrigin(origins = "*")
public class LotController {
    @Autowired
    private LotService lotService;

    @Autowired
    private WebSocketController webSocketController;

    @PostMapping
    public ResponseEntity<?> createLot(@RequestBody CreateLotRequest request, Authentication authentication) {
        try {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            MaterialLot lot = lotService.createLot(userDetails.getUsername(), request);
            
            // Send real-time notification
            webSocketController.notifyLotCreated(lot);
            
            return ResponseEntity.ok(lot);
        } catch (Exception e) {
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

    @GetMapping("/all")
    public ResponseEntity<?> getAllLots() {
        try {
            List<MaterialLot> lots = lotService.getAllLots();
            return ResponseEntity.ok(lots);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to fetch lots: " + e.getMessage());
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
            
            // Send real-time notification
            webSocketController.notifyLotMatched(lot);
            
            return ResponseEntity.ok(lot);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Failed to select recycler: " + e.getMessage());
        }
    }
}
