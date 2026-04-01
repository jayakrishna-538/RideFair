package com.jk.miniproject.RideFair.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class CreateExpenseRequest {
    private String description;
    private Double totalAmount;
    private Long paidById;
    private List<Long> splitAmongIds;
    private Long groupId;
}
