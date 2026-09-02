package com.recircle.repository;

import com.recircle.entity.MaterialCategory;
import com.recircle.entity.Recycler;
import com.recircle.entity.RecyclerOffer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RecyclerOfferRepository extends JpaRepository<RecyclerOffer, UUID> {
    List<RecyclerOffer> findByRecycler(Recycler recycler);
    List<RecyclerOffer> findByMaterialCategory(MaterialCategory materialCategory);
    Optional<RecyclerOffer> findByRecyclerAndMaterialCategory(Recycler recycler, MaterialCategory materialCategory);
    List<RecyclerOffer> findByMaterialCategoryAndIsActiveTrue(MaterialCategory materialCategory);
}
