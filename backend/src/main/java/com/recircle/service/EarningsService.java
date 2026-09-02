package com.recircle.service;

import com.recircle.entity.MaterialLot;
import com.recircle.entity.User;
import com.recircle.repository.MaterialLotRepository;
import com.recircle.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class EarningsService {
    @Autowired
    private MaterialLotRepository lotRepository;

    @Autowired
    private UserRepository userRepository;

    public Map<String, Object> getEarningsSummary(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));

        List<MaterialLot> allLots = lotRepository.findByCollectorOrderByCreatedAtDesc(user);
        
        // Period start dates
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = now.withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime startOfWeek = now.minusDays(7);
        LocalDateTime startOfMonth = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        
        double todayEarnings = 0;
        double weekEarnings = 0;
        double monthEarnings = 0;
        double totalEarnings = 0;
        double totalPaid = 0;
        double totalPending = 0;
        int completedCount = 0;

        for (MaterialLot lot : allLots) {
            // Get value safely
            Double value = lot.getFinalValue();
            if (value == null) {
                value = lot.getEstimatedValue();
            }
            if (value == null) continue;
            
            boolean isCompleted = lot.getStatus() == MaterialLot.LotStatus.COMPLETED || 
                                 lot.getStatus() == MaterialLot.LotStatus.PAID;
            
            LocalDateTime created = lot.getCreatedAt();
            if (created == null) continue;
            
            // Today
            if (created.isAfter(startOfDay) && isCompleted) {
                todayEarnings += value;
            }
            
            // This week
            if (created.isAfter(startOfWeek) && isCompleted) {
                weekEarnings += value;
            }
            
            // This month
            if (created.isAfter(startOfMonth) && isCompleted) {
                monthEarnings += value;
            }
            
            // All time
            if (isCompleted) {
                totalEarnings += value;
                completedCount++;
            }
            
            // Paid
            if (lot.getStatus() == MaterialLot.LotStatus.PAID) {
                totalPaid += value;
            }
            
            // Pending
            if (lot.getStatus() == MaterialLot.LotStatus.PAYMENT_PENDING || 
                lot.getStatus() == MaterialLot.LotStatus.CREATED) {
                totalPending += value;
            }
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalEarnings", Math.round(totalEarnings * 100) / 100.0);
        summary.put("totalPaid", Math.round(totalPaid * 100) / 100.0);
        summary.put("totalPending", Math.round(totalPending * 100) / 100.0);
        summary.put("completedTransactions", completedCount);
        summary.put("totalTransactions", allLots.size());
        summary.put("todayEarnings", Math.round(todayEarnings * 100) / 100.0);
        summary.put("weekEarnings", Math.round(weekEarnings * 100) / 100.0);
        summary.put("monthEarnings", Math.round(monthEarnings * 100) / 100.0);

        return summary;
    }

    public Map<String, Object> getTransactions(String userEmail, String period) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDateTime startDate;
        switch (period) {
            case "today":
                startDate = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
                break;
            case "thisWeek":
                startDate = LocalDateTime.now().minusDays(7);
                break;
            case "thisMonth":
                startDate = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
                break;
            default:
                startDate = LocalDateTime.now().minusDays(365);
                break;
        }

        List<MaterialLot> lots = lotRepository.findByCollectorAndCreatedAtBetween(
            user, startDate, LocalDateTime.now()
        );

        List<Map<String, Object>> transactions = new ArrayList<>();
        for (MaterialLot lot : lots) {
            Double amount = lot.getFinalValue();
            if (amount == null) {
                amount = lot.getEstimatedValue();
            }
            
            Map<String, Object> tx = new LinkedHashMap<>();
            tx.put("lotId", lot.getLotId() != null ? lot.getLotId() : "N/A");
            tx.put("date", lot.getCreatedAt() != null ? lot.getCreatedAt().toString() : "N/A");
            tx.put("amount", amount != null ? amount : 0);
            tx.put("status", lot.getStatus() != null ? lot.getStatus().toString() : "UNKNOWN");
            tx.put("material", lot.getMaterialCategory() != null ? lot.getMaterialCategory().getName() : "Unknown");
            tx.put("weight", lot.getWeightKg() != null ? lot.getWeightKg() : 0);
            transactions.add(tx);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("transactions", transactions);
        response.put("count", transactions.size());
        
        double total = transactions.stream()
            .filter(tx -> tx.get("amount") != null)
            .mapToDouble(tx -> (Double) tx.get("amount"))
            .sum();
        response.put("total", Math.round(total * 100) / 100.0);

        return response;
    }
}
