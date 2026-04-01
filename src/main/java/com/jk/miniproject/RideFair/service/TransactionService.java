package com.jk.miniproject.RideFair.service;

import com.jk.miniproject.RideFair.dto.request.SettleUpRequest;
import com.jk.miniproject.RideFair.dto.response.TransactionResponse;
import com.jk.miniproject.RideFair.entity.Transaction;
import com.jk.miniproject.RideFair.entity.User;
import com.jk.miniproject.RideFair.repository.TransactionRepository;
import com.jk.miniproject.RideFair.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    @Transactional
    public TransactionResponse settleUp(SettleUpRequest request) {
        if (request.getAmount() == null || request.getAmount() <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }
        if (request.getFromUserId().equals(request.getToUserId())) {
            throw new IllegalArgumentException("Cannot settle with yourself");
        }

        User fromUser = userRepository.findById(request.getFromUserId())
                .orElseThrow(() -> new RuntimeException("User not found with id: " + request.getFromUserId()));
        User toUser = userRepository.findById(request.getToUserId())
                .orElseThrow(() -> new RuntimeException("User not found with id: " + request.getToUserId()));

        Transaction transaction = Transaction.builder()
                .fromUser(fromUser)
                .toUser(toUser)
                .amount(request.getAmount())
                .note(request.getNote())
                .build();
        return TransactionResponse.from(transactionRepository.save(transaction));
    }

    public List<TransactionResponse> getTransactionsByUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        return transactionRepository.findByFromUserOrToUserOrderByDateDesc(user, user).stream()
                .map(TransactionResponse::from)
                .collect(Collectors.toList());
    }
}
