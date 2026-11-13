package com.example.demo.controller.admin;

import com.example.demo.dto.request.CheckInRequest;
import com.example.demo.dto.request.EventRequest;
import com.example.demo.dto.request.MerchandiseRequest;
import com.example.demo.dto.request.SeatZoneRequest;
import com.example.demo.dto.response.*;
import com.example.demo.entity.enums.OrderStatus;
import com.example.demo.service.*;
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
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final EventService eventService;
    private final OrderService orderService;
    private final TicketService ticketService;
    private final MerchandiseService merchandiseService;
    private final AdminStatsService adminStatsService;

    // ===== QUẢN LÝ SỰ KIỆN & SƠ ĐỒ GHẾ =====

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

    /** Cập nhật khu vực ghế */
    @PutMapping("/events/{eventId}/zones/{zoneId}")
    public ResponseEntity<EventResponse> updateZone(
            @PathVariable UUID eventId,
            @PathVariable UUID zoneId,
            @Valid @RequestBody SeatZoneRequest request) {
        return ResponseEntity.ok(eventService.updateZone(eventId, zoneId, request));
    }

    /** Xóa khu vực ghế */
    @DeleteMapping("/events/{eventId}/zones/{zoneId}")
    public ResponseEntity<Void> deleteZone(
            @PathVariable UUID eventId,
            @PathVariable UUID zoneId) {
        eventService.deleteZone(eventId, zoneId);
        return ResponseEntity.noContent().build();
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

    // ===== QUẢN LÝ VẬT PHẨM (MERCHANDISE) =====

    /** Thêm vật phẩm lưu niệm cho sự kiện */
    @PostMapping("/events/{eventId}/merchandises")
    public ResponseEntity<MerchandiseResponse> createMerchandise(
            @PathVariable UUID eventId,
            @Valid @RequestBody MerchandiseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(merchandiseService.createMerchandise(eventId, request));
    }

    /** Cập nhật vật phẩm lưu niệm */
    @PutMapping("/merchandises/{id}")
    public ResponseEntity<MerchandiseResponse> updateMerchandise(
            @PathVariable UUID id,
            @Valid @RequestBody MerchandiseRequest request) {
        return ResponseEntity.ok(merchandiseService.updateMerchandise(id, request));
    }

    /** Xóa vật phẩm lưu niệm (chỉ khi chưa phát sinh đơn hàng) */
    @DeleteMapping("/merchandises/{id}")
    public ResponseEntity<Void> deleteMerchandise(@PathVariable UUID id) {
        merchandiseService.deleteMerchandise(id);
        return ResponseEntity.noContent().build();
    }

    // ===== SOÁT VÉ / CHECK-IN QR =====

    /** Soát vé tại cổng bằng mã QR (ticketCode) */
    @PostMapping("/tickets/check-in")
    public ResponseEntity<CheckInResponse> checkInTicket(@Valid @RequestBody CheckInRequest request) {
        return ResponseEntity.ok(ticketService.checkInByTicketCode(request.getTicketCode()));
    }

    /** Thống kê tiến độ check-in của một sự kiện */
    @GetMapping("/events/{eventId}/check-in-stats")
    public ResponseEntity<EventCheckInStatsResponse> getEventCheckInStats(@PathVariable UUID eventId) {
        return ResponseEntity.ok(ticketService.getEventCheckInStats(eventId));
    }

    // ===== QUẢN LÝ ĐƠN HÀNG & DOANH THU =====

    /** Xem tất cả đơn hàng trong hệ thống (có thể lọc ?status=PAID|PENDING|CANCELLED) */
    @GetMapping("/orders")
    public ResponseEntity<List<OrderResponse>> getAllOrders(
            @RequestParam(required = false) OrderStatus status) {
        return ResponseEntity.ok(orderService.getAllOrders(status));
    }

    /** Xem chi tiết bất kỳ đơn hàng nào */
    @GetMapping("/orders/{id}")
    public ResponseEntity<OrderResponse> getOrderDetail(@PathVariable UUID id) {
        return ResponseEntity.ok(orderService.getOrderByIdForAdmin(id));
    }

    /** Thống kê doanh thu & số liệu đơn hàng toàn hệ thống và theo sự kiện */
    @GetMapping("/revenue")
    public ResponseEntity<RevenueStatsResponse> getRevenueStats() {
        return ResponseEntity.ok(adminStatsService.getRevenueStats());
    }
}
