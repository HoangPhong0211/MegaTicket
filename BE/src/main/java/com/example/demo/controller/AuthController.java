package com.example.demo.controller;

import com.example.demo.dto.request.LoginRequest;
import com.example.demo.dto.request.RegisterRequest;
import com.example.demo.dto.response.AuthResponse;
import com.example.demo.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller xử lý các endpoint xác thực (Authentication).
 *
 * Tất cả endpoint ở đây đều PUBLIC (không cần JWT),
 * đã khai báo permitAll trong SecurityConfig.
 *
 * Base URL: /api/auth
 * - POST /api/auth/register → Đăng ký
 * - POST /api/auth/login    → Đăng nhập
 *
 * Controller chỉ làm 2 việc:
 * 1. Nhận request (validate bằng @Valid)
 * 2. Gọi Service và trả response
 * Toàn bộ business logic nằm trong AuthService.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    /**
     * Đăng ký tài khoản mới.
     *
     * @Valid kích hoạt validation từ các annotation trong RegisterRequest
     * (@NotBlank, @Email, @Size...). Nếu lỗi → MethodArgumentNotValidException
     * → GlobalExceptionHandler bắt và trả về 400 với danh sách lỗi.
     *
     * HTTP 201 Created: theo chuẩn REST, tạo tài nguyên mới dùng 201.
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Đăng nhập.
     * HTTP 200 OK: đăng nhập thành công.
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }
}
