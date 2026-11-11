package com.example.demo.controller;

import com.example.demo.dto.request.CreateOrderRequest;
import com.example.demo.dto.response.OrderResponse;
import com.example.demo.entity.User;
import com.example.demo.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller quản lý đơn hàng của user đang đăng nhập.
 *
 * Lấy User từ Authentication.getPrincipal():
 * JwtAuthFilter đã set User entity làm principal trong SecurityContext.
 * Nhờ đó controller biết request này của user nào mà không cần truyền userId.
 */
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class OrderController {

    private final OrderService orderService;

    /**
     * Tạo đơn hàng mới.
     * Yêu cầu đăng nhập (JWT). Trả về 201 Created với chi tiết đơn hàng.
     */
    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(
            @Valid @RequestBody CreateOrderRequest request,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        OrderResponse response = orderService.createOrder(currentUser, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Xem danh sách đơn hàng của tôi.
     */
    @GetMapping("/my")
    public ResponseEntity<List<OrderResponse>> getMyOrders(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(orderService.getMyOrders(currentUser));
    }

    /**
     * Xem chi tiết một đơn hàng (kiểm tra quyền sở hữu trong service).
     */
    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(
            @PathVariable UUID id,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(orderService.getOrderById(id, currentUser));
    }

    /**
     * Hủy đơn hàng (chỉ PENDING).
     * HTTP 204 No Content: thành công nhưng không có body trả về.
     */
    @DeleteMapping("/{id}/cancel")
    public ResponseEntity<Void> cancelOrder(
            @PathVariable UUID id,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        orderService.cancelOrder(id, currentUser);
        return ResponseEntity.noContent().build();
    }
}
