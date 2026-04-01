package com.jk.miniproject.RideFair.dto.request;

import lombok.Data;

@Data
public class CreateBikeRequest {
    private String name;
    private Double fuelEfficiency;
    private Long ownerId;
}
