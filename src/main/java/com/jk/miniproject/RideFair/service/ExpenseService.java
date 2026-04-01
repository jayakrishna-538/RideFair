package com.jk.miniproject.RideFair.service;

import com.jk.miniproject.RideFair.dto.request.CreateExpenseRequest;
import com.jk.miniproject.RideFair.dto.response.ExpenseResponse;
import com.jk.miniproject.RideFair.entity.*;
import com.jk.miniproject.RideFair.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final ExpenseShareRepository expenseShareRepository;
    private final UserRepository userRepository;
    private final FriendGroupRepository groupRepository;

    @Transactional
    public ExpenseResponse createManualExpense(CreateExpenseRequest request) {
        if (request.getDescription() == null || request.getDescription().isBlank()) {
            throw new IllegalArgumentException("Description is required");
        }
        if (request.getTotalAmount() == null || request.getTotalAmount() <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }
        if (request.getSplitAmongIds() == null || request.getSplitAmongIds().isEmpty()) {
            throw new IllegalArgumentException("At least one person must be selected to split among");
        }

        User paidBy = userRepository.findById(request.getPaidById())
                .orElseThrow(() -> new RuntimeException("User not found with id: " + request.getPaidById()));
        FriendGroup group = groupRepository.findById(request.getGroupId())
                .orElseThrow(() -> new RuntimeException("Group not found with id: " + request.getGroupId()));
        List<User> splitAmong = userRepository.findAllById(request.getSplitAmongIds());

        if (splitAmong.size() != request.getSplitAmongIds().size()) {
            throw new IllegalArgumentException("One or more user IDs in split list are invalid");
        }

        Expense expense = Expense.builder()
                .description(request.getDescription())
                .totalAmount(request.getTotalAmount())
                .type(ExpenseType.MANUAL)
                .paidBy(paidBy)
                .group(group)
                .build();
        expense = expenseRepository.save(expense);

        double sharePerPerson = request.getTotalAmount() / splitAmong.size();
        List<ExpenseShare> shares = createShares(expense, splitAmong, sharePerPerson);

        return ExpenseResponse.from(expense, shares);
    }

    @Transactional
    public Expense createRideExpense(String description, Double amount, ExpenseType type,
                                     User paidBy, FriendGroup group, Ride ride,
                                     List<User> splitAmong, double sharePerPerson) {
        Expense expense = Expense.builder()
                .description(description)
                .totalAmount(amount)
                .type(type)
                .paidBy(paidBy)
                .group(group)
                .ride(ride)
                .build();
        expense = expenseRepository.save(expense);
        createShares(expense, splitAmong, sharePerPerson);
        return expense;
    }

    public List<ExpenseResponse> getExpensesByGroup(Long groupId) {
        FriendGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found with id: " + groupId));
        List<Expense> expenses = expenseRepository.findByGroupOrderByDateDesc(group);
        if (expenses.isEmpty()) return List.of();

        List<ExpenseShare> allShares = expenseShareRepository.findByExpenseIn(expenses);
        Map<Long, List<ExpenseShare>> sharesByExpense = allShares.stream()
                .collect(Collectors.groupingBy(s -> s.getExpense().getId()));

        return expenses.stream()
                .map(expense -> ExpenseResponse.from(expense,
                        sharesByExpense.getOrDefault(expense.getId(), List.of())))
                .collect(Collectors.toList());
    }

    private List<ExpenseShare> createShares(Expense expense, List<User> users, double sharePerPerson) {
        double roundedShare = Math.round(sharePerPerson * 100.0) / 100.0;
        List<ExpenseShare> shares = new ArrayList<>();
        for (User user : users) {
            ExpenseShare share = ExpenseShare.builder()
                    .expense(expense)
                    .user(user)
                    .shareAmount(roundedShare)
                    .build();
            shares.add(expenseShareRepository.save(share));
        }
        return shares;
    }
}
