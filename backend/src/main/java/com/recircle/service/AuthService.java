package com.recircle.service;

import com.recircle.dto.AuthRequest;
import com.recircle.dto.RegisterRequest;
import com.recircle.entity.CollectorProfile;
import com.recircle.entity.User;
import com.recircle.repository.CollectorProfileRepository;
import com.recircle.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CollectorProfileRepository collectorProfileRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired(required = false)
    private AuthenticationManager authenticationManager;

    public User register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setRole(request.getRole());
        user.setEnabled(true);

        User savedUser = userRepository.save(user);

        if (request.getRole() == User.UserRole.COLLECTOR) {
            CollectorProfile profile = new CollectorProfile();
            profile.setUser(savedUser);
            collectorProfileRepository.save(profile);
        }

        return savedUser;
    }

    public User login(AuthRequest request) {
        try {
            if (authenticationManager != null) {
                Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
                );
            }
            return userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
        } catch (AuthenticationException e) {
            throw new RuntimeException("Invalid email or password: " + e.getMessage());
        }
    }
}
