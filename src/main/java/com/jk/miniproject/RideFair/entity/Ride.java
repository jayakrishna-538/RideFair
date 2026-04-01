package com.jk.miniproject.RideFair.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "rides")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ride {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "bike_id", nullable = false)
    private Bike bike;

    @ManyToMany
    @JoinTable(
        name = "ride_borrowers",
        joinColumns = @JoinColumn(name = "ride_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @Builder.Default
    private Set<User> borrowers = new HashSet<>();

    @Column(nullable = false)
    private Double distance;

    @Builder.Default
    private Double fuelFilled = 0.0;

    @ManyToOne
    @JoinColumn(name = "fuel_filled_by_id")
    private User fuelFilledBy;

    @Column(nullable = false)
    private Double petrolPrice;

    @Builder.Default
    private LocalDateTime dateTime = LocalDateTime.now();
}
