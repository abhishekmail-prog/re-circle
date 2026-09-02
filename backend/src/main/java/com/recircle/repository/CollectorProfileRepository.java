package com.recircle.repository;

import com.recircle.entity.CollectorProfile;
import com.recircle.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CollectorProfileRepository extends JpaRepository<CollectorProfile, UUID> {
    Optional<CollectorProfile> findByUser(User user);
    Optional<CollectorProfile> findByUserId(UUID userId);
}
