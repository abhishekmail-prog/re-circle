package com.recircle.repository;

import com.recircle.entity.MaterialCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface MaterialCategoryRepository extends JpaRepository<MaterialCategory, UUID> {
    Optional<MaterialCategory> findByName(String name);
}
