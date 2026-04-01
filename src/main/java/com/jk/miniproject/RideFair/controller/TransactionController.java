package com.jk.miniproject.RideFair.controller;

import com.jk.miniproject.RideFair.dto.request.SettleUpRequest;
import com.jk.miniproject.RideFair.dto.response.TransactionResponse;
import com.jk.miniproject.RideFair.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping
    public ResponseEntity<TransactionResponse> settleUp(@RequestBody SettleUpRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(transactionService.settleUp(request));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<TransactionResponse>> getTransactionsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(transactionService.getTransactionsByUser(userId));
    }
}
