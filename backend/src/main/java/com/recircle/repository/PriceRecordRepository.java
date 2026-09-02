package com.recircle.repository;

import com.recircle.entity.MaterialCategory;
import com.recircle.entity.PriceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface PriceRecordRepository extends JpaRepository<PriceRecord, UUID> {
    List<PriceRecord> findByMaterialCategoryOrderByRecordedAtDesc(MaterialCategory materialCategory);
    
    @Query("SELECT p FROM PriceRecord p WHERE p.materialCategory = :category AND p.recordedAt >= :startDate ORDER BY p.recordedAt DESC")
    List<PriceRecord> findRecentPrices(@Param("category") MaterialCategory category, @Param("startDate") LocalDateTime startDate);
    
    @Query("SELECT AVG(p.pricePerKg) FROM PriceRecord p WHERE p.materialCategory = :category AND p.recordedAt >= :startDate")
    Double getAveragePrice(@Param("category") MaterialCategory category, @Param("startDate") LocalDateTime startDate);
}
