package com.jk.miniproject.RideFair.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class LogRideRequest {
    private Long bikeId;
    private List<Long> borrowerIds;
    private Double distance;
    private Double fuelFilled;
    private Long fuelFilledById;
    private Double petrolPrice;
    private Long groupId;
}
