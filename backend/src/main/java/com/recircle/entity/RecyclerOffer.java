package com.recircle.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "recycler_offers")
@Data
@NoArgsConstructor
public class RecyclerOffer {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "recycler_id", nullable = false)
    private Recycler recycler;

    @ManyToOne
    @JoinColumn(name = "material_category_id", nullable = false)
    private MaterialCategory materialCategory;

    @Column(nullable = false)
    private Double pricePerKg;

    @Column
    private Double minWeightKg;

    @Column
    private Double maxWeightKg;

    @Column
    private boolean isActive = true;

    @Column
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
