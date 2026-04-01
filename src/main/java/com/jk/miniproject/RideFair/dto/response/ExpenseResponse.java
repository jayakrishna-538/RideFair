package com.jk.miniproject.RideFair.dto.response;

import com.jk.miniproject.RideFair.entity.Expense;
import com.jk.miniproject.RideFair.entity.ExpenseShare;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Data
public class ExpenseResponse {
    private Long id;
    private String description;
    private Double totalAmount;
    private String type;
    private String paidByName;
    private Long paidById;
    private List<ShareDetail> shares;
    private LocalDate date;

    @Data
    public static class ShareDetail {
        private String userName;
        private Long userId;
        private Double amount;
    }

    public static ExpenseResponse from(Expense expense, List<ExpenseShare> shares) {
        ExpenseResponse response = new ExpenseResponse();
        response.setId(expense.getId());
        response.setDescription(expense.getDescription());
        response.setTotalAmount(expense.getTotalAmount());
        response.setType(expense.getType().name());
        response.setPaidByName(expense.getPaidBy().getName());
        response.setPaidById(expense.getPaidBy().getId());
        response.setDate(expense.getDate());
        response.setShares(
            shares.stream().map(share -> {
                ShareDetail detail = new ShareDetail();
                detail.setUserName(share.getUser().getName());
                detail.setUserId(share.getUser().getId());
                detail.setAmount(share.getShareAmount());
                return detail;
            }).collect(Collectors.toList())
        );
        return response;
    }
}
