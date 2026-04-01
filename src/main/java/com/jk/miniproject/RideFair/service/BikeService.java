package com.jk.miniproject.RideFair.service;

import com.jk.miniproject.RideFair.dto.request.CreateBikeRequest;
import com.jk.miniproject.RideFair.dto.response.BikeResponse;
import com.jk.miniproject.RideFair.entity.Bike;
import com.jk.miniproject.RideFair.entity.User;
import com.jk.miniproject.RideFair.repository.BikeRepository;
import com.jk.miniproject.RideFair.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BikeService {

    private final BikeRepository bikeRepository;
    private final UserRepository userRepository;

    public BikeResponse createBike(CreateBikeRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new IllegalArgumentException("Bike name is required");
        }
        if (request.getFuelEfficiency() == null || request.getFuelEfficiency() <= 0) {
            throw new IllegalArgumentException("Fuel efficiency must be greater than zero");
        }

        User owner = userRepository.findById(request.getOwnerId())
                .orElseThrow(() -> new RuntimeException("User not found with id: " + request.getOwnerId()));
        Bike bike = Bike.builder()
                .name(request.getName())
                .fuelEfficiency(request.getFuelEfficiency())
                .owner(owner)
                .build();
        return BikeResponse.from(bikeRepository.save(bike));
    }

    public List<BikeResponse> getAllBikes() {
        return bikeRepository.findAll().stream()
                .map(BikeResponse::from)
                .collect(Collectors.toList());
    }

    public List<BikeResponse> getBikesByOwner(Long userId) {
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        return bikeRepository.findByOwner(owner).stream()
                .map(BikeResponse::from)
                .collect(Collectors.toList());
    }
}
