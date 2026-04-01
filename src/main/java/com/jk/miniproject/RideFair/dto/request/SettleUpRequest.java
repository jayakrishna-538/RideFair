package com.jk.miniproject.RideFair.dto.request;

import lombok.Data;

@Data
public class SettleUpRequest {
    private Long fromUserId;
    private Long toUserId;
    private Double amount;
    private String note;
}
