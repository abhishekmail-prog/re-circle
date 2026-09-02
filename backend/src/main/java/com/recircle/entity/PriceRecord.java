package com.recircle.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "price_records")
@Data
@NoArgsConstructor
public class PriceRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "material_category_id", nullable = false)
    private MaterialCategory materialCategory;

    @Column(nullable = false)
    private Double pricePerKg;

    @Column(nullable = false)
    private String location;

    @Column
    private String source; // MARKET, RECYCLER, OFFICIAL

    @Column(nullable = false)
    private LocalDateTime recordedAt;

    @PrePersist
    protected void onCreate() {
        recordedAt = LocalDateTime.now();
    }
}
