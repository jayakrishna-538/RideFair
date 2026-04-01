package com.jk.miniproject.RideFair.dto.response;

import com.jk.miniproject.RideFair.entity.Bike;
import lombok.Data;

@Data
public class BikeResponse {
    private Long id;
    private String name;
    private Double fuelEfficiency;
    private UserResponse owner;

    public static BikeResponse from(Bike bike) {
        BikeResponse response = new BikeResponse();
        response.setId(bike.getId());
        response.setName(bike.getName());
        response.setFuelEfficiency(bike.getFuelEfficiency());
        response.setOwner(UserResponse.from(bike.getOwner()));
        return response;
    }
}
