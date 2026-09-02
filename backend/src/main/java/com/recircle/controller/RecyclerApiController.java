package com.recircle.controller;

import com.recircle.entity.MaterialLot;
import com.recircle.repository.MaterialLotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/recycler")
@CrossOrigin(origins = "*")
public class RecyclerApiController {
    @Autowired
    private MaterialLotRepository lotRepository;

    @GetMapping("/lots/incoming")
    public ResponseEntity<?> getIncomingLots() {
        List<MaterialLot> lots = lotRepository.findByStatus(MaterialLot.LotStatus.MATCHED);
        return ResponseEntity.ok(lots);
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("incomingLots", lotRepository.findByStatus(MaterialLot.LotStatus.MATCHED).size());
        stats.put("pendingHandovers", lotRepository.findByStatus(MaterialLot.LotStatus.PICKUP_SCHEDULED).size());
        stats.put("completedTransactions", 0);
        stats.put("totalEarnings", 0);
        return ResponseEntity.ok(stats);
    }
}
