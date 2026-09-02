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

    @GetMapping
    public ResponseEntity<?> getAllRecyclers() {
        try {
            System.out.println("🔍 GET /recyclers called");
            List<Recycler> recyclers = recyclerRepository.findAll();
            System.out.println("🔍 Found " + recyclers.size() + " recyclers");
            return ResponseEntity.ok(recyclers);
        } catch (Exception e) {
            System.err.println("❌ Error: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getRecyclerById(@PathVariable String id) {
        try {
            UUID uuid = UUID.fromString(id);
            Optional<Recycler> recycler = recyclerRepository.findById(uuid);
            if (recycler.isPresent()) {
                return ResponseEntity.ok(recycler.get());
            }
            return ResponseEntity.status(404).body(Map.of("error", "Recycler not found"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(Map.of("error", "Invalid ID format"));
        }
    }
}
