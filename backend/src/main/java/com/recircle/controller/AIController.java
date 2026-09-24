package com.recircle.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

@RestController
@RequestMapping("/ai")
@CrossOrigin(origins = "*")
public class AIController {

    private static final String UPLOAD_DIR = "./uploads/";

    @PostMapping("/classify")
    public ResponseEntity<?> classifyImage(@RequestParam("image") MultipartFile file) {
        try {
            // Encode as base64 data URL — survives Render redeploys
            String mimeType = file.getContentType() != null ? file.getContentType() : "image/jpeg";
            String base64 = java.util.Base64.getEncoder().encodeToString(file.getBytes());
            String dataUrl = "data:" + mimeType + ";base64," + base64;

            // Demo classification based on filename keywords
            String suggestedCategory = classifyByFilename(file.getOriginalFilename());
            double confidence = 0.75 + Math.random() * 0.2;

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("suggestedCategory", suggestedCategory);
            response.put("confidence", Math.round(confidence * 100));
            response.put("isDemo", true);
            response.put("message", "⚠️ DEMO MODE: Classification is simulated based on filename");
            response.put("filename", file.getOriginalFilename());
            response.put("imageUrl", dataUrl);

            return ResponseEntity.ok(response);
        } catch (IOException e) {
            return ResponseEntity.badRequest().body("Failed to upload image: " + e.getMessage());
        }
    }

    private String classifyByFilename(String filename) {
        String lower = filename.toLowerCase();
        if (lower.contains("battery") || lower.contains("batt")) return "Battery";
        if (lower.contains("cable") || lower.contains("wire")) return "Cable";
        if (lower.contains("crt") || lower.contains("monitor")) return "CRT";
        if (lower.contains("lcd") || lower.contains("screen") || lower.contains("display")) return "LCD Panel";
        if (lower.contains("pcb") || lower.contains("board") || lower.contains("circuit")) return "PCB";
        if (lower.contains("motor")) return "Motor";
        if (lower.contains("phone") || lower.contains("mobile")) return "Mobile phone";
        if (lower.contains("laptop") || lower.contains("notebook")) return "Laptop";
        if (lower.contains("plastic")) return "Mixed plastic";
        if (lower.contains("magnet") || lower.contains("bearing")) return "Magnet-bearing assembly";
        return "Other e-waste";
    }

    @GetMapping("/categories")
    public ResponseEntity<?> getCategories() {
        List<String> categories = Arrays.asList(
            "CRT", "LCD Panel", "PCB", "Cable", "Battery", 
            "Motor", "Magnet-bearing assembly", "Mixed plastic", 
            "Mobile phone", "Laptop", "Other e-waste"
        );
        return ResponseEntity.ok(categories);
    }
}
