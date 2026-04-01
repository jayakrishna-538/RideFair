package com.jk.miniproject.RideFair.dto.response;

import com.jk.miniproject.RideFair.entity.Ride;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
public class RideResponse {
    private Long id;
    private String bikeName;
    private String ownerName;
    private List<UserResponse> borrowers;
    private Double distance;
    private Double fuelFilled;
    private String fuelFilledByName;
    private Double petrolPrice;
    private Double rideCost;
    private LocalDateTime dateTime;

    public static RideResponse from(Ride ride) {
        RideResponse response = new RideResponse();
        response.setId(ride.getId());
        response.setBikeName(ride.getBike().getName());
        response.setOwnerName(ride.getBike().getOwner().getName());
        response.setBorrowers(
            ride.getBorrowers().stream()
                .map(UserResponse::from)
                .collect(Collectors.toList())
        );
        response.setDistance(ride.getDistance());
        response.setFuelFilled(ride.getFuelFilled());
        response.setFuelFilledByName(
            ride.getFuelFilledBy() != null ? ride.getFuelFilledBy().getName() : null
        );
        response.setPetrolPrice(ride.getPetrolPrice());

        double efficiency = ride.getBike().getFuelEfficiency();
        double rideCost = efficiency > 0
                ? (ride.getDistance() / efficiency) * ride.getPetrolPrice()
                : 0.0;
        response.setRideCost(Math.round(rideCost * 100.0) / 100.0);

        response.setDateTime(ride.getDateTime());
        return response;
    }
}
