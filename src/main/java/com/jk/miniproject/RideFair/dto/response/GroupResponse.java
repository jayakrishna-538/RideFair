package com.jk.miniproject.RideFair.dto.response;

import com.jk.miniproject.RideFair.entity.FriendGroup;
import lombok.Data;
import java.util.List;
import java.util.stream.Collectors;

@Data
public class GroupResponse {
    private Long id;
    private String name;
    private List<UserResponse> members;

    public static GroupResponse from(FriendGroup group) {
        GroupResponse response = new GroupResponse();
        response.setId(group.getId());
        response.setName(group.getName());
        response.setMembers(
            group.getMembers().stream()
                .map(UserResponse::from)
                .collect(Collectors.toList())
        );
        return response;
    }
}
