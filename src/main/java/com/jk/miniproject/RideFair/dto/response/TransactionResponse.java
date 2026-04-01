package com.jk.miniproject.RideFair.dto.response;

import com.jk.miniproject.RideFair.entity.Transaction;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TransactionResponse {
    private Long id;
    private UserResponse fromUser;
    private UserResponse toUser;
    private Double amount;
    private String note;
    private LocalDateTime date;

    public static TransactionResponse from(Transaction transaction) {
        TransactionResponse response = new TransactionResponse();
        response.setId(transaction.getId());
        response.setFromUser(UserResponse.from(transaction.getFromUser()));
        response.setToUser(UserResponse.from(transaction.getToUser()));
        response.setAmount(transaction.getAmount());
        response.setNote(transaction.getNote());
        response.setDate(transaction.getDate());
        return response;
    }
}
