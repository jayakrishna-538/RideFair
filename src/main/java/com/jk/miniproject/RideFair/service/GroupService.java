package com.jk.miniproject.RideFair.service;

import com.jk.miniproject.RideFair.dto.request.CreateGroupRequest;
import com.jk.miniproject.RideFair.dto.response.BalanceResponse;
import com.jk.miniproject.RideFair.dto.response.GroupResponse;
import com.jk.miniproject.RideFair.entity.FriendGroup;
import com.jk.miniproject.RideFair.entity.User;
import com.jk.miniproject.RideFair.repository.FriendGroupRepository;
import com.jk.miniproject.RideFair.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final FriendGroupRepository groupRepository;
    private final UserRepository userRepository;
    private final BalanceService balanceService;

    public GroupResponse createGroup(CreateGroupRequest request) {
        List<User> members = userRepository.findAllById(request.getMemberIds());
        FriendGroup group = FriendGroup.builder()
                .name(request.getName())
                .members(new HashSet<>(members))
                .build();
        return GroupResponse.from(groupRepository.save(group));
    }

    public List<GroupResponse> getAllGroups() {
        return groupRepository.findAll().stream()
                .map(GroupResponse::from)
                .collect(Collectors.toList());
    }

    public GroupResponse getGroupById(Long id) {
        FriendGroup group = groupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Group not found with id: " + id));
        return GroupResponse.from(group);
    }

    public GroupResponse addMember(Long groupId, Long userId) {
        FriendGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found with id: " + groupId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        group.getMembers().add(user);
        return GroupResponse.from(groupRepository.save(group));
    }

    public GroupResponse removeMember(Long groupId, Long userId) {
        FriendGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found with id: " + groupId));

        List<BalanceResponse> balances = balanceService.getPairwiseBalances(groupId);
        boolean hasDebt = balances.stream()
                .anyMatch(b -> b.getFromUser().getId().equals(userId) || b.getToUser().getId().equals(userId));
        if (hasDebt) {
            throw new IllegalArgumentException("Cannot remove member with unsettled balances in this group. Please settle all debts first.");
        }

        group.getMembers().removeIf(member -> member.getId().equals(userId));
        return GroupResponse.from(groupRepository.save(group));
    }
}
