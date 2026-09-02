package com.recircle.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "recyclers")
@Data
@NoArgsConstructor
public class Recycler {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String companyName;

    @Column(nullable = false)
    private String facilityAddress;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column
    private String authorizationNumber;

    @Column(nullable = false)
    private boolean authorized = false;

    @Column
    private String contactPerson;

    @Column
    private String contactPhone;

    @Column
    private boolean pickupAvailable = false;

    @Column
    private String serviceArea;

    @Column
    private Double serviceRadiusKm = 10.0;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime updatedAt;

    @Column
    private boolean isActive = true;

    @OneToMany(mappedBy = "recycler", cascade = CascadeType.ALL)
    private List<RecyclerOffer> offers = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
