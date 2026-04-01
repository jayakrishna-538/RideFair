package com.jk.miniproject.RideFair.controller;

import com.jk.miniproject.RideFair.dto.request.CreateBikeRequest;
import com.jk.miniproject.RideFair.dto.response.BikeResponse;
import com.jk.miniproject.RideFair.service.BikeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bikes")
@RequiredArgsConstructor
public class BikeController {

    private final BikeService bikeService;

    @PostMapping
    public ResponseEntity<BikeResponse> createBike(@RequestBody CreateBikeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bikeService.createBike(request));
    }

    @GetMapping
    public ResponseEntity<List<BikeResponse>> getAllBikes() {
        return ResponseEntity.ok(bikeService.getAllBikes());
    }

    @GetMapping("/owner/{userId}")
    public ResponseEntity<List<BikeResponse>> getBikesByOwner(@PathVariable Long userId) {
        return ResponseEntity.ok(bikeService.getBikesByOwner(userId));
    }
}
