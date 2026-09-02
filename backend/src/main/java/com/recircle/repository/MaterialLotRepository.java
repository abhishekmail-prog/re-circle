package com.recircle.repository;

import com.recircle.entity.MaterialLot;
import com.recircle.entity.User;
import com.recircle.entity.MaterialLot.LotStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MaterialLotRepository extends JpaRepository<MaterialLot, UUID> {
    Optional<MaterialLot> findByLotId(String lotId);
    List<MaterialLot> findByCollectorOrderByCreatedAtDesc(User collector);
    List<MaterialLot> findBySelectedRecyclerIdOrderByCreatedAtDesc(UUID recyclerId);
    List<MaterialLot> findByStatus(LotStatus status);
    List<MaterialLot> findByCollectorAndCreatedAtBetween(User collector, LocalDateTime start, LocalDateTime end);
    
    @Query("SELECT COUNT(l) FROM MaterialLot l WHERE l.collector = :collector")
    long countByCollector(@Param("collector") User collector);
    
    @Query("SELECT SUM(l.netEarnings) FROM MaterialLot l WHERE l.collector = :collector AND l.status = 'COMPLETED'")
    Double sumNetEarningsByCollector(@Param("collector") User collector);
}
