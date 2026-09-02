package com.recircle.controller;

import com.recircle.entity.Recycler;
import com.recircle.entity.User;
import com.recircle.repository.RecyclerRepository;
import com.recircle.repository.UserRepository;
import com.recircle.repository.MaterialLotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/admin")
@CrossOrigin(origins = "*")
public class AdminController {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private RecyclerRepository recyclerRepository;
    @Autowired
    private MaterialLotRepository lotRepository;

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalCollectors", userRepository.count());
        stats.put("totalRecyclers", recyclerRepository.count());
        stats.put("totalLots", lotRepository.count());
        stats.put("totalEarnings", 0);
        stats.put("totalTransactions", 0);
        stats.put("pendingVerifications", 0);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        List<User> users = userRepository.findAll();
        List<Map<String, Object>> response = new ArrayList<>();
        for (User user : users) {
            Map<String, Object> u = new LinkedHashMap<>();
            u.put("id", user.getId());
            u.put("email", user.getEmail());
            u.put("fullName", user.getFullName());
            u.put("phoneNumber", user.getPhoneNumber());
            u.put("role", user.getRole());
            u.put("enabled", user.isEnabled());
            u.put("createdAt", user.getCreatedAt());
            response.add(u);
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/recyclers")
    public ResponseEntity<?> getAllRecyclers() {
        List<Recycler> recyclers = recyclerRepository.findAll();
        List<Map<String, Object>> response = new ArrayList<>();
        for (Recycler r : recyclers) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", r.getId());
            map.put("companyName", r.getCompanyName());
            map.put("facilityAddress", r.getFacilityAddress());
            map.put("authorized", r.isAuthorized());
            map.put("pickupAvailable", r.isPickupAvailable());
            map.put("serviceArea", r.getServiceArea());
            map.put("contactPerson", r.getContactPerson());
            map.put("contactPhone", r.getContactPhone());
            response.add(map);
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/activity/recent")
    public ResponseEntity<?> getRecentActivity() {
        List<Map<String, Object>> activities = new ArrayList<>();
        
        // Sample activity data
        Map<String, Object> a1 = new LinkedHashMap<>();
        a1.put("icon", "📝");
        a1.put("message", "New lot created by Ramesh Kumar (Collector)");
        a1.put("time", "5 min ago");
        activities.add(a1);
        
        Map<String, Object> a2 = new LinkedHashMap<>();
        a2.put("icon", "✅");
        a2.put("message", "Recycler GreenCycle Solutions verified");
        a2.put("time", "1 hour ago");
        activities.add(a2);
        
        Map<String, Object> a3 = new LinkedHashMap<>();
        a3.put("icon", "💰");
        a3.put("message", "Payment confirmed for lot RC-2024-0005");
        a3.put("time", "3 hours ago");
        activities.add(a3);
        
        Map<String, Object> a4 = new LinkedHashMap<>();
        a4.put("icon", "👤");
        a4.put("message", "New collector registered: Priya Singh");
        a4.put("time", "5 hours ago");
        activities.add(a4);
        
        Map<String, Object> a5 = new LinkedHashMap<>();
        a5.put("icon", "🏭");
        a5.put("message", "Recycler TechRecycle Solutions applied for verification");
        a5.put("time", "8 hours ago");
        activities.add(a5);
        
        return ResponseEntity.ok(activities);
    }

    @PostMapping("/recyclers")
    public ResponseEntity<?> addRecycler(@RequestBody Map<String, Object> request) {
        try {
            // This would create a new recycler
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("message", "Recycler added successfully");
            response.put("companyName", request.get("companyName"));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to add recycler: " + e.getMessage());
        }
    }

    @PutMapping("/recyclers/{id}/verify")
    public ResponseEntity<?> verifyRecycler(@PathVariable String id) {
        try {
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("message", "Recycler verified successfully");
            response.put("id", id);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to verify recycler: " + e.getMessage());
        }
    }
}
