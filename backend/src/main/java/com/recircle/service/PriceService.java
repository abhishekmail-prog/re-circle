package com.recircle.service;

import com.recircle.entity.MaterialCategory;
import com.recircle.entity.PriceRecord;
import com.recircle.repository.MaterialCategoryRepository;
import com.recircle.repository.PriceRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PriceService {
    @Autowired
    private PriceRecordRepository priceRecordRepository;

    @Autowired
    private MaterialCategoryRepository categoryRepository;

    public Map<String, Object> getPriceInfo(String categoryName) {
        MaterialCategory category = categoryRepository.findByName(categoryName)
            .orElseThrow(() -> new RuntimeException("Category not found"));

        Map<String, Object> response = new HashMap<>();
        
        // Get last 30 days prices
        List<PriceRecord> recentPrices = priceRecordRepository.findRecentPrices(
            category, 
            LocalDateTime.now().minusDays(30)
        );

        // Get last 7 days prices
        List<PriceRecord> last7Days = recentPrices.stream()
            .filter(p -> p.getRecordedAt().isAfter(LocalDateTime.now().minusDays(7)))
            .collect(Collectors.toList());

        // Get previous 7 days prices (days 7-14)
        List<PriceRecord> previous7Days = recentPrices.stream()
            .filter(p -> p.getRecordedAt().isBefore(LocalDateTime.now().minusDays(7)))
            .filter(p -> p.getRecordedAt().isAfter(LocalDateTime.now().minusDays(14)))
            .collect(Collectors.toList());

        response.put("category", category.getName());
        response.put("currentPrice", category.getDefaultPricePerKg());
        
        // Calculate trend
        double trend = 0;
        if (!last7Days.isEmpty() && !previous7Days.isEmpty()) {
            double currentAvg = last7Days.stream()
                .mapToDouble(PriceRecord::getPricePerKg)
                .average()
                .orElse(0.0);
            double previousAvg = previous7Days.stream()
                .mapToDouble(PriceRecord::getPricePerKg)
                .average()
                .orElse(0.0);
            
            if (previousAvg > 0) {
                trend = ((currentAvg - previousAvg) / previousAvg) * 100;
                trend = Math.round(trend * 10) / 10.0;
            }
        } else if (!last7Days.isEmpty() && category.getDefaultPricePerKg() != null) {
            // If no previous data, compare with default price
            double currentAvg = last7Days.stream()
                .mapToDouble(PriceRecord::getPricePerKg)
                .average()
                .orElse(category.getDefaultPricePerKg());
            trend = ((currentAvg - category.getDefaultPricePerKg()) / category.getDefaultPricePerKg()) * 100;
            trend = Math.round(trend * 10) / 10.0;
        }
        response.put("trend", trend);
        
        // Price range
        if (!recentPrices.isEmpty()) {
            double min = recentPrices.stream()
                .mapToDouble(PriceRecord::getPricePerKg)
                .min()
                .orElse(0.0);
            double max = recentPrices.stream()
                .mapToDouble(PriceRecord::getPricePerKg)
                .max()
                .orElse(0.0);
            response.put("minPrice", Math.round(min * 100) / 100.0);
            response.put("maxPrice", Math.round(max * 100) / 100.0);
        } else {
            double basePrice = category.getDefaultPricePerKg();
            response.put("minPrice", Math.round((basePrice * 0.8) * 100) / 100.0);
            response.put("maxPrice", Math.round((basePrice * 1.2) * 100) / 100.0);
        }
        
        // Recent prices for history
        List<Map<String, Object>> priceHistory = new ArrayList<>();
        for (int i = 29; i >= 0; i--) {
            LocalDateTime date = LocalDateTime.now().minusDays(i);
            List<PriceRecord> dayPrices = priceRecordRepository.findRecentPrices(
                category, date
            );
            if (!dayPrices.isEmpty()) {
                double avg = dayPrices.stream()
                    .mapToDouble(PriceRecord::getPricePerKg)
                    .average()
                    .orElse(category.getDefaultPricePerKg());
                Map<String, Object> entry = new HashMap<>();
                entry.put("date", date.toString());
                entry.put("price", Math.round(avg * 100) / 100.0);
                entry.put("location", "Mumbai");
                priceHistory.add(entry);
            }
        }
        
        // If no history, generate from price records
        if (priceHistory.isEmpty()) {
            for (PriceRecord record : recentPrices) {
                Map<String, Object> entry = new HashMap<>();
                entry.put("date", record.getRecordedAt().toString());
                entry.put("price", Math.round(record.getPricePerKg() * 100) / 100.0);
                entry.put("location", record.getLocation());
                priceHistory.add(entry);
            }
        }
        
        response.put("recentPrices", priceHistory);

        return response;
    }

    public Map<String, Object> getPriceTrends(String categoryName) {
        MaterialCategory category = categoryRepository.findByName(categoryName)
            .orElseThrow(() -> new RuntimeException("Category not found"));

        Map<String, Object> trends = new HashMap<>();
        trends.put("category", category.getName());
        trends.put("currentPrice", category.getDefaultPricePerKg());
        
        List<PriceRecord> recentPrices = priceRecordRepository.findRecentPrices(
            category, LocalDateTime.now().minusDays(30)
        );
        
        // Calculate weekly average
        List<PriceRecord> weeklyPrices = recentPrices.stream()
            .filter(p -> p.getRecordedAt().isAfter(LocalDateTime.now().minusDays(7)))
            .collect(Collectors.toList());
        
        if (!weeklyPrices.isEmpty()) {
            double weeklyAvg = weeklyPrices.stream()
                .mapToDouble(PriceRecord::getPricePerKg)
                .average()
                .orElse(0.0);
            trends.put("weeklyAverage", Math.round(weeklyAvg * 100) / 100.0);
        }

        // Monthly average
        if (!recentPrices.isEmpty()) {
            double monthlyAvg = recentPrices.stream()
                .mapToDouble(PriceRecord::getPricePerKg)
                .average()
                .orElse(0.0);
            trends.put("monthlyAverage", Math.round(monthlyAvg * 100) / 100.0);
        }

        // Historical data for chart
        List<Map<String, Object>> history = new ArrayList<>();
        for (int i = 29; i >= 0; i--) {
            LocalDateTime date = LocalDateTime.now().minusDays(i);
            List<PriceRecord> dayPrices = priceRecordRepository.findRecentPrices(
                category, date
            );
            if (!dayPrices.isEmpty()) {
                double avg = dayPrices.stream()
                    .mapToDouble(PriceRecord::getPricePerKg)
                    .average()
                    .orElse(category.getDefaultPricePerKg());
                Map<String, Object> entry = new HashMap<>();
                entry.put("date", date.toString());
                entry.put("price", Math.round(avg * 100) / 100.0);
                history.add(entry);
            }
        }
        trends.put("history", history);

        return trends;
    }
}
