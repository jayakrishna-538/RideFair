package com.jk.miniproject.RideFair.controller;

import com.jk.miniproject.RideFair.dto.request.AddMemberRequest;
import com.jk.miniproject.RideFair.dto.request.CreateGroupRequest;
import com.jk.miniproject.RideFair.dto.response.GroupResponse;
import com.jk.miniproject.RideFair.service.GroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    @PostMapping
    public ResponseEntity<GroupResponse> createGroup(@RequestBody CreateGroupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(groupService.createGroup(request));
    }

    @GetMapping
    public ResponseEntity<List<GroupResponse>> getAllGroups() {
        return ResponseEntity.ok(groupService.getAllGroups());
    }

    @GetMapping("/{id}")
    public ResponseEntity<GroupResponse> getGroupById(@PathVariable Long id) {
        return ResponseEntity.ok(groupService.getGroupById(id));
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<GroupResponse> addMember(@PathVariable Long id, @RequestBody AddMemberRequest request) {
        return ResponseEntity.ok(groupService.addMember(id, request.getUserId()));
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<GroupResponse> removeMember(@PathVariable Long id, @PathVariable Long userId) {
        return ResponseEntity.ok(groupService.removeMember(id, userId));
    }
}
