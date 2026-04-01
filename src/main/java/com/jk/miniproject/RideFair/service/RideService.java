package com.jk.miniproject.RideFair.service;

import com.jk.miniproject.RideFair.dto.request.LogRideRequest;
import com.jk.miniproject.RideFair.dto.response.RideResponse;
import com.jk.miniproject.RideFair.entity.*;
import com.jk.miniproject.RideFair.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RideService {

    private final RideRepository rideRepository;
    private final BikeRepository bikeRepository;
    private final UserRepository userRepository;
    private final FriendGroupRepository groupRepository;
    private final ExpenseService expenseService;

    /**
     * Logs a ride and auto-generates expenses using the two-expense model:
     *
     * Expense 1 (RIDE_USAGE): rideCost, paidBy = owner, split among borrowers
     *   → Borrowers consumed the owner's fuel, they owe the owner
     *
     * Expense 2 (RIDE_FUEL): fuelFilled, paidBy = filler, assigned to owner only
     *   → Filler put fuel into the owner's bike, owner owes the filler
     *
     * This correctly handles all cases: no fill, partial fill, overfill,
     * single/multi borrower, and owner-as-borrower (self-debts cancel out).
     */
    @Transactional
    public RideResponse logRide(LogRideRequest request) {
        if (request.getBorrowerIds() == null || request.getBorrowerIds().isEmpty()) {
            throw new IllegalArgumentException("At least one borrower is required");
        }
        if (request.getDistance() == null || request.getDistance() <= 0) {
            throw new IllegalArgumentException("Distance must be greater than zero");
        }
        if (request.getPetrolPrice() == null || request.getPetrolPrice() <= 0) {
            throw new IllegalArgumentException("Petrol price must be greater than zero");
        }

        Bike bike = bikeRepository.findById(request.getBikeId())
                .orElseThrow(() -> new RuntimeException("Bike not found with id: " + request.getBikeId()));

        if (bike.getFuelEfficiency() <= 0) {
            throw new IllegalArgumentException("Bike fuel efficiency must be greater than zero");
        }

        List<User> borrowers = userRepository.findAllById(request.getBorrowerIds());
        if (borrowers.size() != request.getBorrowerIds().size()) {
            throw new IllegalArgumentException("One or more borrower IDs are invalid");
        }

        FriendGroup group = groupRepository.findById(request.getGroupId())
                .orElseThrow(() -> new RuntimeException("Group not found with id: " + request.getGroupId()));

        User fuelFilledBy = null;
        if (request.getFuelFilledById() != null) {
            fuelFilledBy = userRepository.findById(request.getFuelFilledById())
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + request.getFuelFilledById()));
        }

        Ride ride = Ride.builder()
                .bike(bike)
                .borrowers(new HashSet<>(borrowers))
                .distance(request.getDistance())
                .fuelFilled(request.getFuelFilled() != null ? request.getFuelFilled() : 0.0)
                .fuelFilledBy(fuelFilledBy)
                .petrolPrice(request.getPetrolPrice())
                .build();
        ride = rideRepository.save(ride);

        User owner = bike.getOwner();
        double rideCost = (request.getDistance() / bike.getFuelEfficiency()) * request.getPetrolPrice();
        rideCost = Math.round(rideCost * 100.0) / 100.0;
        int borrowerCount = borrowers.size();

        double usageSharePerPerson = rideCost / borrowerCount;
        expenseService.createRideExpense(
                "Ride: " + bike.getName() + " - " + request.getDistance() + " km",
                rideCost,
                ExpenseType.RIDE_USAGE,
                owner,
                group,
                ride,
                borrowers,
                usageSharePerPerson
        );

        // Expense 2: Fuel fill (only if someone filled petrol)
        // Filler put fuel into the owner's bike. Owner owes the filler.
        // The fuel goes into the owner's tank, so the owner is the sole beneficiary.
        double fuelFilled = request.getFuelFilled() != null ? request.getFuelFilled() : 0.0;
        if (fuelFilled > 0 && fuelFilledBy != null) {
            expenseService.createRideExpense(
                    "Fuel fill: " + bike.getName(),
                    fuelFilled,
                    ExpenseType.RIDE_FUEL,
                    fuelFilledBy,
                    group,
                    ride,
                    List.of(owner),
                    fuelFilled
            );
        }

        return RideResponse.from(ride);
    }

    public List<RideResponse> getAllRides() {
        return rideRepository.findAllByOrderByDateTimeDesc().stream()
                .map(RideResponse::from)
                .collect(Collectors.toList());
    }

    public List<RideResponse> getRidesByBike(Long bikeId) {
        Bike bike = bikeRepository.findById(bikeId)
                .orElseThrow(() -> new RuntimeException("Bike not found with id: " + bikeId));
        return rideRepository.findByBike(bike).stream()
                .map(RideResponse::from)
                .collect(Collectors.toList());
    }

    public List<RideResponse> getRidesByUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        return rideRepository.findByBorrowersContaining(user).stream()
                .map(RideResponse::from)
                .collect(Collectors.toList());
    }
}
