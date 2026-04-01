package com.jk.miniproject.RideFair.repository;

import com.jk.miniproject.RideFair.entity.Bike;
import com.jk.miniproject.RideFair.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BikeRepository extends JpaRepository<Bike, Long> {

    List<Bike> findByOwner(User owner);
}
