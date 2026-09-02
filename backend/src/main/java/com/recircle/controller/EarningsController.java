package com.recircle.controller;

import com.recircle.service.EarningsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/earnings")
@CrossOrigin(origins = "*")
public class EarningsController {
    @Autowired
    private EarningsService earningsService;

    @GetMapping("/summary")
    public ResponseEntity<?> getEarningsSummary(Authentication authentication) {
        try {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            System.out.println("📊 Fetching earnings for: " + userDetails.getUsername());
            Map<String, Object> summary = earningsService.getEarningsSummary(userDetails.getUsername());
            System.out.println("📊 Summary: " + summary);
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            System.err.println("❌ Error fetching earnings: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/transactions")
    public ResponseEntity<?> getTransactions(
            @RequestParam(required = false, defaultValue = "thisMonth") String period,
            Authentication authentication) {
        try {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            Map<String, Object> transactions = earningsService.getTransactions(
                userDetails.getUsername(), 
                period
            );
            return ResponseEntity.ok(transactions);
        } catch (Exception e) {
            System.err.println("❌ Error fetching transactions: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}
