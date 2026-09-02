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
        List<Recycler> recyclers = recyclerRepository.findAll();
        System.out.println("📋 RecyclerService: Found " + recyclers.size() + " recyclers");
        return recyclers;
    }

    public List<Recycler> getNearbyRecyclers(double lat, double lng) {
        List<Recycler> recyclers = recyclerRepository.findNearbyRecyclers(lat, lng);
        return recyclers;
    }

    public Recycler getRecyclerById(String id) {
        return recyclerRepository.findById(UUID.fromString(id))
            .orElseThrow(() -> new RuntimeException("Recycler not found"));
    }
    
    public Recycler saveRecycler(Recycler recycler) {
        return recyclerRepository.save(recycler);
    }
    
    public void deleteRecycler(String id) {
        recyclerRepository.deleteById(UUID.fromString(id));
    }
}
