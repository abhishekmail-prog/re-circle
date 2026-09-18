package com.recircle.repository;

import com.recircle.entity.Bid;
import com.recircle.entity.MaterialLot;
import com.recircle.entity.Recycler;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BidRepository extends JpaRepository<Bid, UUID> {

    List<Bid> findByLotOrderByAmountPerKgDesc(MaterialLot lot);

    List<Bid> findByLotAndStatus(MaterialLot lot, Bid.BidStatus status);

    Optional<Bid> findByLotAndRecycler(MaterialLot lot, Recycler recycler);

    Optional<Bid> findByIdAndLot(UUID id, MaterialLot lot);
}
