package com.recircle.dto;

import lombok.Data;

@Data
public class CreateLotRequest {
    private String materialCategoryName;
    private String description;
    private Double weightKg;
    private String condition;
    private String sourceType;
    private Double collectionLatitude;
    private Double collectionLongitude;
    private String collectionAddress;
}
