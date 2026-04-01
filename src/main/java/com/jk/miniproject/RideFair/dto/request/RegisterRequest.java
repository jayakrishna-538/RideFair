package com.jk.miniproject.RideFair.dto.request;

import lombok.Data;

@Data
public class RegisterRequest {
    private String name;
    private String username;
    private String password;
    private String phone;
}
