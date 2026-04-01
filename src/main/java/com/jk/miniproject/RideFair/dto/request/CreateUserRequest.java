package com.jk.miniproject.RideFair.dto.request;

import lombok.Data;

@Data
public class CreateUserRequest {
    private String name;
    private String email;
    private String phone;
}
