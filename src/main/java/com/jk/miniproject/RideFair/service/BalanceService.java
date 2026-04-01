package com.jk.miniproject.RideFair.service;

import com.jk.miniproject.RideFair.dto.response.BalanceResponse;
import com.jk.miniproject.RideFair.dto.response.SimplifiedDebtResponse;
import com.jk.miniproject.RideFair.dto.response.UserResponse;
import com.jk.miniproject.RideFair.entity.*;
import com.jk.miniproject.RideFair.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BalanceService {

    private final FriendGroupRepository groupRepository;
    private final ExpenseRepository expenseRepository;
    private final ExpenseShareRepository expenseShareRepository;
    private final TransactionRepository transactionRepository;

    /**
     * Computes pairwise balances for a group.
     *
     * For each ExpenseShare: the share's user owes the expense's paidBy the shareAmount.
     * For each Transaction: the fromUser has paid the toUser, reducing that debt.
     *
     * Self-debts (user owes themselves) are skipped.
     * Only non-zero balances are returned.
     */
    public List<BalanceResponse> getPairwiseBalances(Long groupId) {
        Map<Long, Map<Long, Double>> balanceMap = computeBalanceMap(groupId);
        return convertToBalanceResponses(balanceMap, groupId);
    }

    /**
     * Computes simplified debts — the minimum number of transactions
     * needed to settle all debts in the group.
     *
     * Algorithm:
     * 1. Compute each user's net balance (total owed to them - total they owe)
     * 2. Separate into creditors (positive balance) and debtors (negative balance)
     * 3. Greedily match the largest debtor with the largest creditor
     * 4. Repeat until all balances are zero
     */
    public List<SimplifiedDebtResponse> getSimplifiedDebts(Long groupId) {
        Map<Long, Map<Long, Double>> balanceMap = computeBalanceMap(groupId);
        FriendGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found with id: " + groupId));

        Map<Long, User> userMap = new HashMap<>();
        for (User member : group.getMembers()) {
            userMap.put(member.getId(), member);
        }

        // Step 1: Compute net balance per user
        Map<Long, Double> netBalances = new HashMap<>();
        for (User member : group.getMembers()) {
            netBalances.put(member.getId(), 0.0);
        }

        for (Map.Entry<Long, Map<Long, Double>> fromEntry : balanceMap.entrySet()) {
            Long fromId = fromEntry.getKey();
            for (Map.Entry<Long, Double> toEntry : fromEntry.getValue().entrySet()) {
                Long toId = toEntry.getKey();
                Double amount = toEntry.getValue();
                if (amount > 0) {
                    netBalances.merge(fromId, -amount, Double::sum);
                    netBalances.merge(toId, amount, Double::sum);
                }
            }
        }

        // Step 2: Separate into creditors and debtors
        List<long[]> creditors = new ArrayList<>();
        List<long[]> debtors = new ArrayList<>();

        for (Map.Entry<Long, Double> entry : netBalances.entrySet()) {
            double rounded = Math.round(entry.getValue() * 100.0) / 100.0;
            if (rounded > 0.01) {
                creditors.add(new long[]{entry.getKey(), Math.round(rounded * 100)});
            } else if (rounded < -0.01) {
                debtors.add(new long[]{entry.getKey(), Math.round(Math.abs(rounded) * 100)});
            }
        }

        // Sort by amount descending for greedy matching
        creditors.sort((a, b) -> Long.compare(b[1], a[1]));
        debtors.sort((a, b) -> Long.compare(b[1], a[1]));

        // Step 3: Greedy matching
        List<SimplifiedDebtResponse> result = new ArrayList<>();
        int ci = 0, di = 0;

        while (ci < creditors.size() && di < debtors.size()) {
            long creditorId = creditors.get(ci)[0];
            long creditorAmount = creditors.get(ci)[1];
            long debtorId = debtors.get(di)[0];
            long debtorAmount = debtors.get(di)[1];

            long transfer = Math.min(creditorAmount, debtorAmount);

            if (transfer > 0) {
                User fromUser = userMap.get(debtorId);
                User toUser = userMap.get(creditorId);
                if (fromUser != null && toUser != null) {
                    result.add(new SimplifiedDebtResponse(
                            UserResponse.from(fromUser),
                            UserResponse.from(toUser),
                            transfer / 100.0
                    ));
                }
            }

            creditors.get(ci)[1] -= transfer;
            debtors.get(di)[1] -= transfer;

            if (creditors.get(ci)[1] == 0) ci++;
            if (debtors.get(di)[1] == 0) di++;
        }

        return result;
    }

    /**
     * Gets the net balance for a specific user within a group.
     * Positive amount = user is owed money. Negative = user owes money.
     */
    public Double getUserNetBalance(Long userId, Long groupId) {
        Map<Long, Map<Long, Double>> balanceMap = computeBalanceMap(groupId);
        double net = 0.0;

        // What others owe this user
        for (Map.Entry<Long, Map<Long, Double>> fromEntry : balanceMap.entrySet()) {
            Double owedToUser = fromEntry.getValue().getOrDefault(userId, 0.0);
            if (owedToUser > 0) net += owedToUser;
        }

        // What this user owes others
        Map<Long, Double> userDebts = balanceMap.getOrDefault(userId, Collections.emptyMap());
        for (Double amount : userDebts.values()) {
            if (amount > 0) net -= amount;
        }

        return Math.round(net * 100.0) / 100.0;
    }

    /**
     * Builds the core balance map: balanceMap[fromUserId][toUserId] = amount owed.
     *
     * Reads all ExpenseShares (debts created) and Transactions (debts paid)
     * for the group, then nets them out.
     */
    private Map<Long, Map<Long, Double>> computeBalanceMap(Long groupId) {
        FriendGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found with id: " + groupId));

        // balanceMap[A][B] > 0 means A owes B that amount
        Map<Long, Map<Long, Double>> balanceMap = new HashMap<>();

        // Process all expenses in this group
        List<Expense> expenses = expenseRepository.findByGroup(group);
        List<ExpenseShare> allShares = expenses.isEmpty()
                ? Collections.emptyList()
                : expenseShareRepository.findByExpenseIn(expenses);

        for (ExpenseShare share : allShares) {
            Long owerId = share.getUser().getId();
            Long owedId = share.getExpense().getPaidBy().getId();

            // Skip self-debts (user owes themselves)
            if (owerId.equals(owedId)) continue;

            balanceMap
                    .computeIfAbsent(owerId, k -> new HashMap<>())
                    .merge(owedId, share.getShareAmount(), Double::sum);
        }

        // Process all transactions (settlements reduce debts)
        Set<Long> memberIds = group.getMembers().stream()
                .map(User::getId)
                .collect(Collectors.toSet());

        Set<Long> processedTxnIds = new HashSet<>();
        for (User member : group.getMembers()) {
            List<Transaction> transactions = transactionRepository.findByFromUserOrToUser(member, member);
            for (Transaction txn : transactions) {
                if (!processedTxnIds.add(txn.getId())) continue;

                Long fromId = txn.getFromUser().getId();
                Long toId = txn.getToUser().getId();

                if (!memberIds.contains(fromId) || !memberIds.contains(toId)) continue;

                balanceMap
                        .computeIfAbsent(fromId, k -> new HashMap<>())
                        .merge(toId, -txn.getAmount(), Double::sum);
            }
        }

        // Net out bidirectional debts: if A owes B 100 and B owes A 30, net is A owes B 70
        Map<Long, Map<Long, Double>> netted = new HashMap<>();
        Set<String> processed = new HashSet<>();

        for (Map.Entry<Long, Map<Long, Double>> fromEntry : balanceMap.entrySet()) {
            Long a = fromEntry.getKey();
            for (Map.Entry<Long, Double> toEntry : fromEntry.getValue().entrySet()) {
                Long b = toEntry.getKey();
                String key = Math.min(a, b) + "-" + Math.max(a, b);
                if (processed.contains(key)) continue;
                processed.add(key);

                double aOwesB = balanceMap.getOrDefault(a, Collections.emptyMap()).getOrDefault(b, 0.0);
                double bOwesA = balanceMap.getOrDefault(b, Collections.emptyMap()).getOrDefault(a, 0.0);
                double net = aOwesB - bOwesA;

                if (Math.abs(net) > 0.01) {
                    if (net > 0) {
                        netted.computeIfAbsent(a, k -> new HashMap<>()).put(b, Math.round(net * 100.0) / 100.0);
                    } else {
                        netted.computeIfAbsent(b, k -> new HashMap<>()).put(a, Math.round(Math.abs(net) * 100.0) / 100.0);
                    }
                }
            }
        }

        return netted;
    }

    private List<BalanceResponse> convertToBalanceResponses(Map<Long, Map<Long, Double>> balanceMap, Long groupId) {
        FriendGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        Map<Long, User> userMap = new HashMap<>();
        for (User member : group.getMembers()) {
            userMap.put(member.getId(), member);
        }

        List<BalanceResponse> responses = new ArrayList<>();
        for (Map.Entry<Long, Map<Long, Double>> fromEntry : balanceMap.entrySet()) {
            User fromUser = userMap.get(fromEntry.getKey());
            if (fromUser == null) continue;
            for (Map.Entry<Long, Double> toEntry : fromEntry.getValue().entrySet()) {
                User toUser = userMap.get(toEntry.getKey());
                if (toUser == null) continue;
                responses.add(new BalanceResponse(
                        UserResponse.from(fromUser),
                        UserResponse.from(toUser),
                        toEntry.getValue()
                ));
            }
        }
        return responses;
    }
}
