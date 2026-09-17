package com.recircle.service;

import com.recircle.dto.CreateLotRequest;
import com.recircle.entity.MaterialCategory;
import com.recircle.entity.MaterialLot;
import com.recircle.entity.Recycler;
import com.recircle.entity.User;
import com.recircle.repository.MaterialCategoryRepository;
import com.recircle.repository.MaterialLotRepository;
import com.recircle.repository.RecyclerRepository;
import com.recircle.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class LotService {

    private static final Logger logger = LoggerFactory.getLogger(LotService.class);

    @Autowired
    private MaterialLotRepository lotRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MaterialCategoryRepository categoryRepository;

    @Autowired
    private RecyclerRepository recyclerRepository;

    public MaterialLot createLot(String userEmail, CreateLotRequest request) {
        User collector = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));

        MaterialCategory category = categoryRepository.findByName(request.getMaterialCategoryName())
            .orElseThrow(() -> new RuntimeException("Material category not found"));

        MaterialLot lot = new MaterialLot();
        lot.setCollector(collector);
        lot.setMaterialCategory(category);
        lot.setDescription(request.getDescription());
        lot.setWeightKg(request.getWeightKg());
        lot.setCondition(request.getCondition());
        lot.setSourceType(request.getSourceType());
        lot.setCollectionLatitude(request.getCollectionLatitude());
        lot.setCollectionLongitude(request.getCollectionLongitude());
        lot.setCollectionAddress(request.getCollectionAddress());

        if (category.getDefaultPricePerKg() != null && request.getWeightKg() != null) {
            lot.setEstimatedValue(category.getDefaultPricePerKg() * request.getWeightKg());
        }

        return lotRepository.save(lot);
    }

    public List<MaterialLot> getLotsByCollector(String userEmail) {
        User collector = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return lotRepository.findByCollectorOrderByCreatedAtDesc(collector);
    }

    public MaterialLot getLotByLotId(String lotId) {
        return lotRepository.findByLotId(lotId)
            .orElseThrow(() -> new RuntimeException("Lot not found: " + lotId));
    }

    public List<MaterialLot> getAllLots() {
        return lotRepository.findAll();
    }

    public MaterialLot selectRecycler(String lotId, String recyclerId) {
        MaterialLot lot = getLotByLotId(lotId);

        if (recyclerId != null && !recyclerId.isBlank()) {
            try {
                UUID uuid = UUID.fromString(recyclerId);
                recyclerRepository.findById(uuid).ifPresent(lot::setSelectedRecycler);
            } catch (IllegalArgumentException e) {
                logger.warn("Demo recycler id '{}' — skipping DB lookup", recyclerId);
            }
        }

        lot.setStatus(MaterialLot.LotStatus.MATCHED);

        if (lot.getEstimatedValue() != null) {
            double transportCost = 200;
            lot.setTransportCost(transportCost);
            lot.setNetEarnings(lot.getEstimatedValue() - transportCost);
        }

        return lotRepository.save(lot);
    }

    public MaterialLot updateLotStatus(String lotId, MaterialLot.LotStatus status) {
        MaterialLot lot = getLotByLotId(lotId);
        lot.setStatus(status);
        return lotRepository.save(lot);
    }
}
