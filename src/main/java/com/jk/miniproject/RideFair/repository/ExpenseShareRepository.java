package com.jk.miniproject.RideFair.repository;

import com.jk.miniproject.RideFair.entity.Expense;
import com.jk.miniproject.RideFair.entity.ExpenseShare;
import com.jk.miniproject.RideFair.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExpenseShareRepository extends JpaRepository<ExpenseShare, Long> {

    List<ExpenseShare> findByExpenseIn(List<Expense> expenses);

    List<ExpenseShare> findByUser(User user);
}
