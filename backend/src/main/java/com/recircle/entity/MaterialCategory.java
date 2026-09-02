package com.recircle.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "material_categories")
@Data
@NoArgsConstructor
public class MaterialCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String name;

    @Column
    private String description;

    @Column
    private String icon;

    @Column
    private String safetyGuidance;

    @Column
    private Double defaultPricePerKg;

    @Column
    private boolean isActive = true;

    public MaterialCategory(String name, String description, Double defaultPricePerKg) {
        this.name = name;
        this.description = description;
        this.defaultPricePerKg = defaultPricePerKg;
    }
}
