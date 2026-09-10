package com.recircle.controller;

import com.recircle.dto.CreateLotRequest;
import com.recircle.entity.MaterialLot;
import com.recircle.service.LotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/lots")
public class LotController {

    @Autowired
    private LotService lotService;

    // Create a new lot (COLLECTOR only)
    @PostMapping
    @PreAuthorize("hasRole('COLLECTOR')")
    public ResponseEntity<MaterialLot> createLot(@RequestBody CreateLotRequest request, Principal principal) {
        MaterialLot lot = lotService.createLot(principal.getName(), request);
        return ResponseEntity.ok(lot);
    }

    // Get current collector's lots
    @GetMapping("/my")
    @PreAuthorize("hasRole('COLLECTOR')")
    public ResponseEntity<List<MaterialLot>> getMyLots(Principal principal) {
        return ResponseEntity.ok(lotService.getLotsByCollector(principal.getName()));
    }

    // Get all lots (ADMIN or RECYCLER)
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECYCLER')")
    public ResponseEntity<List<MaterialLot>> getAllLots() {
        return ResponseEntity.ok(lotService.getAllLots());
    }

    // Get a lot by database id
    @GetMapping("/{id}")
    public ResponseEntity<MaterialLot> getLotById(@PathVariable String id) {
        return ResponseEntity.ok(lotService.getLotByLotId(id));
    }

    // Get a lot by its public lotId (e.g., RC-XXXX)
    @GetMapping("/lot/{lotId}")
    public ResponseEntity<MaterialLot> getLotByLotId(@PathVariable String lotId) {
        return ResponseEntity.ok(lotService.getLotByLotId(lotId));
    }
}
