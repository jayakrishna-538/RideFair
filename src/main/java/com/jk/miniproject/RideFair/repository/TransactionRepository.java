package com.jk.miniproject.RideFair.repository;

import com.jk.miniproject.RideFair.entity.Transaction;
import com.jk.miniproject.RideFair.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findByFromUserOrToUser(User fromUser, User toUser);

    List<Transaction> findByFromUserOrToUserOrderByDateDesc(User fromUser, User toUser);
}
