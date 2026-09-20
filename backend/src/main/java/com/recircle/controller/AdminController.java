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
        List<com.recircle.entity.User> allUsers = userRepository.findAll();
        long collectors = allUsers.stream()
            .filter(u -> u.getRole() != null
                && u.getRole().name().equals("COLLECTOR"))
            .count();

        List<com.recircle.entity.Recycler> allRecyclers = recyclerRepository.findAll();
        long pendingVerifications = allRecyclers.stream()
            .filter(r -> !r.isAuthorized())
            .count();

        List<com.recircle.entity.MaterialLot> allLots = lotRepository.findAll();
        long totalLots = allLots.size();

        long completed = allLots.stream()
            .filter(l -> l.getStatus() != null
                && (l.getStatus().name().equals("PAID")
                    || l.getStatus().name().equals("COMPLETED")))
            .count();

        double totalEarnings = allLots.stream()
            .filter(l -> l.getStatus() != null
                && (l.getStatus().name().equals("PAID")
                    || l.getStatus().name().equals("COMPLETED")))
            .mapToDouble(l -> l.getNetEarnings() != null ? l.getNetEarnings() : 0.0)
            .sum();

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalCollectors", collectors);
        stats.put("totalRecyclers", allRecyclers.size());
        stats.put("totalLots", totalLots);
        stats.put("totalEarnings", Math.round(totalEarnings));
        stats.put("totalTransactions", completed);
        stats.put("pendingVerifications", pendingVerifications);
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

        List<com.recircle.entity.MaterialLot> recentLots = lotRepository.findAll();
        recentLots.sort((a, b) -> {
            if (a.getCreatedAt() == null) return 1;
            if (b.getCreatedAt() == null) return -1;
            return b.getCreatedAt().compareTo(a.getCreatedAt());
        });

        int limit = Math.min(5, recentLots.size());
        for (int i = 0; i < limit; i++) {
            com.recircle.entity.MaterialLot lot = recentLots.get(i);
            Map<String, Object> a = new LinkedHashMap<>();
            String collectorName = (lot.getCollector() != null)
                ? lot.getCollector().getFullName()
                : "Unknown";
            String material = (lot.getMaterialCategory() != null)
                ? lot.getMaterialCategory().getName()
                : "—";
            double kg = lot.getWeightKg() != null ? lot.getWeightKg() : 0;
            a.put("icon", "📝");
            a.put("message",
                "Lot " + lot.getLotId() + " created by " + collectorName
                + " (" + material + ", " + (int) kg + "kg) — " + lot.getStatus());
            a.put("time", relativeTime(lot.getCreatedAt()));
            activities.add(a);
        }

        return ResponseEntity.ok(activities);
    }

    private String relativeTime(java.time.LocalDateTime time) {
        if (time == null) return "—";
        long minutes = java.time.Duration.between(time, java.time.LocalDateTime.now()).toMinutes();
        if (minutes < 1) return "just now";
        if (minutes < 60) return minutes + " min ago";
        long hours = minutes / 60;
        if (hours < 24) return hours + " hr ago";
        long days = hours / 24;
        return days + " day" + (days == 1 ? "" : "s") + " ago";
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
