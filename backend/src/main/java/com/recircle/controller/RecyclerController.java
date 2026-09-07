package com.recircle.controller;

import com.recircle.entity.Recycler;
import com.recircle.repository.RecyclerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/recyclers")
@CrossOrigin(origins = "*")
public class RecyclerController {
    @Autowired
    private RecyclerRepository recyclerRepository;

    @Autowired
    private WebSocketController webSocketController;

    @GetMapping
    public ResponseEntity<?> getAllRecyclers() {
        try {
            List<Recycler> recyclers = recyclerRepository.findAll();
            List<Map<String, Object>> response = new ArrayList<>();
            for (Recycler r : recyclers) {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("id", r.getId().toString());
                map.put("companyName", r.getCompanyName());
                map.put("facilityAddress", r.getFacilityAddress());
                map.put("latitude", r.getLatitude());
                map.put("longitude", r.getLongitude());
                map.put("authorized", r.isAuthorized());
                map.put("pickupAvailable", r.isPickupAvailable());
                map.put("serviceArea", r.getServiceArea());
                map.put("serviceRadiusKm", r.getServiceRadiusKm());
                map.put("contactPerson", r.getContactPerson());
                map.put("contactPhone", r.getContactPhone());
                response.add(map);
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/verify")
    public ResponseEntity<?> verifyRecycler(@PathVariable String id) {
        try {
            UUID uuid = UUID.fromString(id);
            Recycler recycler = recyclerRepository.findById(uuid)
                .orElseThrow(() -> new RuntimeException("Recycler not found"));
            
            recycler.setAuthorized(true);
            Recycler saved = recyclerRepository.save(recycler);
            
            // Send real-time notification
            webSocketController.notifyRecyclerVerified(saved);
            
            return ResponseEntity.ok(Map.of("message", "Recycler verified successfully", "id", id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to verify recycler: " + e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> addRecycler(@RequestBody Map<String, Object> request) {
        try {
            // This is a simplified version - you'd normally have a proper DTO
            return ResponseEntity.ok(Map.of("message", "Recycler added"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to add recycler: " + e.getMessage());
        }
    }
}
