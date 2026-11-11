package com.example.demo.controller.admin;

import com.example.demo.dto.request.EventRequest;
import com.example.demo.dto.request.SeatZoneRequest;
import com.example.demo.dto.response.EventResponse;
import com.example.demo.dto.response.OrderResponse;
import com.example.demo.service.EventService;
import com.example.demo.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller dành riêng cho Admin.
 * Base path: /api/admin
 *
 * Bảo vệ 2 lớp:
 * 1. SecurityConfig: .requestMatchers("/api/admin/**").hasRole("ADMIN")
 * 2. @PreAuthorize("hasRole('ADMIN')"): annotation trên method (defense-in-depth)
 *
 * Gom Admin API vào package/controller riêng giúp:
 * - Dễ audit các endpoint nhạy cảm
 * - Dễ thêm logging/rate-limiting riêng cho Admin sau này
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')") // Áp dụng cho toàn bộ controller
public class AdminController {

    private final EventService eventService;
    private final OrderService orderService;

    // ===== QUẢN LÝ SỰ KIỆN =====

    /** Tạo sự kiện mới (kèm danh sách zones) */
    @PostMapping("/events")
    public ResponseEntity<EventResponse> createEvent(@Valid @RequestBody EventRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(eventService.createEvent(request));
    }

    /** Thêm zone mới vào sự kiện */
    @PostMapping("/events/{eventId}/zones")
    public ResponseEntity<EventResponse> addZone(
            @PathVariable UUID eventId,
            @Valid @RequestBody SeatZoneRequest request) {
        return ResponseEntity.ok(eventService.addZoneToEvent(eventId, request));
    }

    /** Cập nhật sự kiện */
    @PutMapping("/events/{id}")
    public ResponseEntity<EventResponse> updateEvent(
            @PathVariable UUID id,
            @Valid @RequestBody EventRequest request) {
        return ResponseEntity.ok(eventService.updateEvent(id, request));
    }

    /** Xóa sự kiện */
    @DeleteMapping("/events/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable UUID id) {
        eventService.deleteEvent(id);
        return ResponseEntity.noContent().build();
    }

    // ===== QUẢN LÝ ĐƠN HÀNG =====

    /** Xem tất cả đơn hàng trong hệ thống */
    @GetMapping("/orders")
    public ResponseEntity<List<OrderResponse>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }
}
