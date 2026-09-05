package com.recircle.service;

import com.recircle.entity.Recycler;
import com.recircle.repository.RecyclerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class RecyclerService {
    @Autowired
    private RecyclerRepository recyclerRepository;

    public List<Recycler> getAllRecyclers() {
        // Only return authorized and active recyclers
        return recyclerRepository.findByAuthorizedTrueAndIsActiveTrue();
    }

    public List<Recycler> getNearbyRecyclers(double lat, double lng) {
        return recyclerRepository.findNearbyRecyclers(lat, lng);
    }

    public Recycler getRecyclerById(String id) {
        return recyclerRepository.findById(UUID.fromString(id))
            .orElseThrow(() -> new RuntimeException("Recycler not found"));
    }
}
