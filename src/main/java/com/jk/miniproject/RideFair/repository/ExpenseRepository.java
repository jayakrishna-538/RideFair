package com.jk.miniproject.RideFair.repository;

import com.jk.miniproject.RideFair.entity.Expense;
import com.jk.miniproject.RideFair.entity.FriendGroup;
import com.jk.miniproject.RideFair.entity.Ride;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByGroup(FriendGroup group);

    List<Expense> findByRide(Ride ride);

    List<Expense> findByGroupOrderByDateDesc(FriendGroup group);
}
