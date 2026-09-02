package com.recircle.controller;

import com.recircle.dto.AuthRequest;
import com.recircle.dto.AuthResponse;
import com.recircle.dto.RegisterRequest;
import com.recircle.entity.User;
import com.recircle.security.JwtUtil;
import com.recircle.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"}, allowCredentials = "true")
public class AuthController {
    @Autowired
    private AuthService authService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            System.out.println("📝 Register attempt: " + request.getEmail());
            User user = authService.register(request);
            String token = jwtUtil.generateToken(user);
            return ResponseEntity.ok(new AuthResponse(
                token,
                user.getEmail(),
                user.getFullName(),
                user.getRole().name(),
                user.getId().toString()
            ));
        } catch (Exception e) {
            System.err.println("❌ Registration failed: " + e.getMessage());
            return ResponseEntity.badRequest().body("Registration failed: " + e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest request) {
        try {
            System.out.println("🔐 Login attempt: " + request.getEmail());
            User user = authService.login(request);
            System.out.println("✅ Login successful: " + user.getEmail());
            String token = jwtUtil.generateToken(user);
            return ResponseEntity.ok(new AuthResponse(
                token,
                user.getEmail(),
                user.getFullName(),
                user.getRole().name(),
                user.getId().toString()
            ));
        } catch (Exception e) {
            System.err.println("❌ Login failed: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Login failed: " + e.getMessage());
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            return ResponseEntity.ok("Authenticated!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}
