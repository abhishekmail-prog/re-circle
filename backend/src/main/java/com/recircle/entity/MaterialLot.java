package com.recircle.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "material_lots")
@Data
@NoArgsConstructor
public class MaterialLot {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String lotId;

    @ManyToOne
    @JoinColumn(name = "collector_id", nullable = false)
    private User collector;

    @ManyToOne
    @JoinColumn(name = "material_category_id", nullable = false)
    private MaterialCategory materialCategory;

    @ManyToOne
    @JoinColumn(name = "recycler_id")
    private Recycler selectedRecycler;

    @Column
    private String imageUrl;

    @Column
    private String description;

    @Column(nullable = false)
    private Double weightKg;

    @Column
    private Double verifiedWeightKg;

    @Column
    private String condition;

    @Column
    private String sourceType;

    @Column
    private Double collectionLatitude;

    @Column
    private Double collectionLongitude;

    @Column
    private String collectionAddress;

    @Column
    private Double offeredPricePerKg;

    @Column
    private Double finalPricePerKg;

    @Column
    private Double estimatedValue;

    @Column
    private Double finalValue;

    @Column
    private Double transportCost;

    @Column
    private Double netEarnings;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LotStatus status = LotStatus.CREATED;

    @Column
    private String qrCodeData;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime updatedAt;

    @Column
    private LocalDateTime handoverAt;

    @Column
    private LocalDateTime completedAt;

    @Column(columnDefinition = "boolean default true")
    private boolean isSynced = true;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        generateLotId();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    private void generateLotId() {
        if (this.lotId == null) {
            String year = String.valueOf(LocalDateTime.now().getYear());
            String sequence = String.format("%06d", (int)(Math.random() * 1000000));
            this.lotId = "RC-" + year + "-" + sequence;
        }
    }

    public enum LotStatus {
        CREATED,
        MATCHED,
        PICKUP_SCHEDULED,
        IN_TRANSIT,
        HANDED_OVER,
        RECEIVED,
        PAYMENT_PENDING,
        PAID,
        COMPLETED
    }
}
