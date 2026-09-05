package com.recircle.controller;

import com.recircle.entity.Recycler;
import com.recircle.repository.RecyclerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/recyclers")
public class RecyclerController {
    @Autowired
    private RecyclerRepository recyclerRepository;

    @GetMapping
    public ResponseEntity<?> getAllRecyclers() {
        try {
            List<Recycler> recyclers = recyclerRepository.findAll();
            
            // Build simple response without any nested objects
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
                // DO NOT include user, offers, or any other nested objects
                response.add(map);
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
}
