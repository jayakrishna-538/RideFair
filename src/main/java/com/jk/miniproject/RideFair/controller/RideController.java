package com.jk.miniproject.RideFair.controller;

import com.jk.miniproject.RideFair.dto.request.LogRideRequest;
import com.jk.miniproject.RideFair.dto.response.RideResponse;
import com.jk.miniproject.RideFair.service.RideService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rides")
@RequiredArgsConstructor
public class RideController {

    private final RideService rideService;

    @PostMapping
    public ResponseEntity<RideResponse> logRide(@RequestBody LogRideRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(rideService.logRide(request));
    }

    @GetMapping
    public ResponseEntity<List<RideResponse>> getAllRides() {
        return ResponseEntity.ok(rideService.getAllRides());
    }

    @GetMapping("/bike/{bikeId}")
    public ResponseEntity<List<RideResponse>> getRidesByBike(@PathVariable Long bikeId) {
        return ResponseEntity.ok(rideService.getRidesByBike(bikeId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<RideResponse>> getRidesByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(rideService.getRidesByUser(userId));
    }
}
