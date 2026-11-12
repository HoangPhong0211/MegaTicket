package com.example.demo.controller;

import com.example.demo.dto.response.MerchandiseResponse;
import com.example.demo.service.MerchandiseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller công khai để xem danh sách & chi tiết vật phẩm lưu niệm của sự kiện.
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MerchandiseController {

    private final MerchandiseService merchandiseService;

    /** Danh sách vật phẩm của một sự kiện (public via GET /api/events/**) */
    @GetMapping("/events/{eventId}/merchandises")
    public ResponseEntity<List<MerchandiseResponse>> getByEvent(@PathVariable UUID eventId) {
        return ResponseEntity.ok(merchandiseService.getMerchandisesByEvent(eventId));
    }

    /** Chi tiết một vật phẩm (public via GET /api/merchandises/**) */
    @GetMapping("/merchandises/{id}")
    public ResponseEntity<MerchandiseResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(merchandiseService.getMerchandiseById(id));
    }
}
