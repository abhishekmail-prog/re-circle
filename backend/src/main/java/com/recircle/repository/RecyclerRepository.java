package com.recircle.repository;

import com.recircle.entity.Recycler;
import com.recircle.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RecyclerRepository extends JpaRepository<Recycler, UUID> {
    Optional<Recycler> findByUser(User user);
    Optional<Recycler> findByUserId(UUID userId);
    List<Recycler> findByAuthorizedTrueAndIsActiveTrue();
    
    @Query("SELECT r FROM Recycler r WHERE r.authorized = true AND r.isActive = true " +
           "AND (6371 * acos(cos(radians(:lat)) * cos(radians(r.latitude)) * " +
           "cos(radians(r.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(r.latitude)))) < r.serviceRadiusKm")
    List<Recycler> findNearbyRecyclers(@Param("lat") double lat, @Param("lng") double lng);
}
