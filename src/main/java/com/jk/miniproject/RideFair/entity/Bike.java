package com.jk.miniproject.RideFair.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "bikes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Double fuelEfficiency;

    @ManyToOne
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;
}
