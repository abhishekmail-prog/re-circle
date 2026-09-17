package com.recircle.controller;

import com.recircle.dto.CreateLotRequest;
import com.recircle.entity.MaterialLot;
import com.recircle.service.LotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/lots")
public class LotController {

    @Autowired
    private LotService lotService;

    @PostMapping
    public ResponseEntity<MaterialLot> createLot(@RequestBody CreateLotRequest request, Principal principal) {
        MaterialLot lot = lotService.createLot(principal.getName(), request);
        return ResponseEntity.ok(lot);
    }

    @GetMapping("/my")
    public ResponseEntity<List<MaterialLot>> getMyLots(Principal principal) {
        return ResponseEntity.ok(lotService.getLotsByCollector(principal.getName()));
    }

    @GetMapping
    public ResponseEntity<List<MaterialLot>> getAllLots() {
        return ResponseEntity.ok(lotService.getAllLots());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MaterialLot> getLotById(@PathVariable String id) {
        return ResponseEntity.ok(lotService.getLotByLotId(id));
    }

    @GetMapping("/lot/{lotId}")
    public ResponseEntity<MaterialLot> getLotByLotId(@PathVariable String lotId) {
        return ResponseEntity.ok(lotService.getLotByLotId(lotId));
    }

    @PostMapping("/{lotId}/select-recycler")
    public ResponseEntity<?> selectRecycler(@PathVariable String lotId,
                                            @RequestBody Map<String, String> body) {
        String recyclerId = body.get("recyclerId");
        if (recyclerId == null || recyclerId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "recyclerId is required"));
        }
        MaterialLot updated = lotService.selectRecycler(lotId, recyclerId);
        return ResponseEntity.ok(updated);
    }

    // ─── Recycler: list lots assigned to me that need handover ─────
    @GetMapping("/recycler/pending-handovers")
    public ResponseEntity<?> getMyPendingHandovers(Principal principal) {
        try {
            return ResponseEntity.ok(
                lotService.getPendingHandoversForRecycler(principal.getName())
            );
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ─── Recycler: confirm handover with verified weight + final price ─────
    @PostMapping("/{lotId}/handover")
    public ResponseEntity<?> confirmHandover(@PathVariable String lotId,
                                             @RequestBody Map<String, Object> body,
                                             Principal principal) {
        try {
            MaterialLot updated = lotService.confirmHandover(
                lotId, principal.getName(), body
            );
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
