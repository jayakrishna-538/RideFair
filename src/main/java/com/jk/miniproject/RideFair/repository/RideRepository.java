package com.jk.miniproject.RideFair.repository;

import com.jk.miniproject.RideFair.entity.Bike;
import com.jk.miniproject.RideFair.entity.Ride;
import com.jk.miniproject.RideFair.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RideRepository extends JpaRepository<Ride, Long> {

    List<Ride> findByBike(Bike bike);

    List<Ride> findByBorrowersContaining(User user);

    List<Ride> findAllByOrderByDateTimeDesc();
}
