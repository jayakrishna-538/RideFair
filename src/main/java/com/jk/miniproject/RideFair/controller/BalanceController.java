package com.jk.miniproject.RideFair.controller;

import com.jk.miniproject.RideFair.dto.response.BalanceResponse;
import com.jk.miniproject.RideFair.dto.response.SimplifiedDebtResponse;
import com.jk.miniproject.RideFair.service.BalanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/balances")
@RequiredArgsConstructor
public class BalanceController {

    private final BalanceService balanceService;

    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<BalanceResponse>> getPairwiseBalances(@PathVariable Long groupId) {
        return ResponseEntity.ok(balanceService.getPairwiseBalances(groupId));
    }

    @GetMapping("/group/{groupId}/simplified")
    public ResponseEntity<List<SimplifiedDebtResponse>> getSimplifiedDebts(@PathVariable Long groupId) {
        return ResponseEntity.ok(balanceService.getSimplifiedDebts(groupId));
    }

    @GetMapping("/user/{userId}/group/{groupId}")
    public ResponseEntity<Double> getUserBalance(@PathVariable Long userId, @PathVariable Long groupId) {
        return ResponseEntity.ok(balanceService.getUserNetBalance(userId, groupId));
    }
}
