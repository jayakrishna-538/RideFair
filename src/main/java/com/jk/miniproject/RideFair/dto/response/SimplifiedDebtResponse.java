package com.jk.miniproject.RideFair.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SimplifiedDebtResponse {
    private UserResponse fromUser;
    private UserResponse toUser;
    private Double amount;
}
