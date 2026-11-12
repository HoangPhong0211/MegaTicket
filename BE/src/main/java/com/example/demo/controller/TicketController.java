package com.example.demo.controller;

import com.example.demo.dto.response.ETicketResponse;
import com.example.demo.entity.User;
import com.example.demo.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller cho Khách hàng xem Vé điện tử (E-Ticket) đã mua.
 * Yêu cầu đăng nhập (JWT).
 */
@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TicketController {

    private final TicketService ticketService;

    /**
     * Xem toàn bộ vé điện tử đã thanh toán thành công của tôi.
     */
    @GetMapping("/my")
    public ResponseEntity<List<ETicketResponse>> getMyETickets(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ticketService.getMyETickets(currentUser));
    }

    /**
     * Xem vé điện tử thuộc một đơn hàng cụ thể (phải là đơn PAID của chính user).
     */
    @GetMapping("/orders/{orderId}")
    public ResponseEntity<List<ETicketResponse>> getETicketsByOrder(
            @PathVariable UUID orderId,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ticketService.getETicketsByOrder(orderId, currentUser));
    }
}
