package com.jk.miniproject.RideFair.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true)
    private String username;

    @Column(unique = true)
    private String email;

    private String phone;

    private String password;

    @Builder.Default
    private Boolean registered = false;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
