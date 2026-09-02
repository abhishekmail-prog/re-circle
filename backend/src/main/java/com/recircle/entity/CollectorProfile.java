package com.recircle.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "collector_profiles")
@Data
@NoArgsConstructor
public class CollectorProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column
    private String address;

    @Column
    private Double latitude;

    @Column
    private Double longitude;

    @Column
    private String preferredLanguage;

    @Column
    private Integer totalLots = 0;

    @Column
    private Double totalEarnings = 0.0;

    @Column
    private Integer completedTransactions = 0;

    @Column
    private Double rating = 0.0;

    @Column
    private LocalDateTime lastActiveAt;

    @Column
    private boolean isVerified = false;

    @PreUpdate
    protected void onUpdate() {
        lastActiveAt = LocalDateTime.now();
    }
}
