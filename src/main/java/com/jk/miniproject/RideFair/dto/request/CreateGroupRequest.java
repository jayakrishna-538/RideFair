package com.jk.miniproject.RideFair.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class CreateGroupRequest {
    private String name;
    private List<Long> memberIds;
}
