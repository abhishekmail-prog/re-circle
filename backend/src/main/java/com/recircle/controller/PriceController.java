package com.recircle.controller;

import com.recircle.service.PriceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/prices")
@CrossOrigin(origins = "*")
public class PriceController {
    @Autowired
    private PriceService priceService;

    @GetMapping
    public ResponseEntity<?> getPrices(@RequestParam String category) {
        try {
            Map<String, Object> response = priceService.getPriceInfo(category);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/trends")
    public ResponseEntity<?> getTrends(@RequestParam String category) {
        try {
            Map<String, Object> trends = priceService.getPriceTrends(category);
            return ResponseEntity.ok(trends);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}
