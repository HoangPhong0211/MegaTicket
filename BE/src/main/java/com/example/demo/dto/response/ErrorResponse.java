package com.example.demo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * DTO dùng để trả về thông báo lỗi có cấu trúc (thay vì stack trace thô).
 *
 * Ví dụ response khi lỗi:
 * {
 *   "message": "Email đã được sử dụng"
 * }
 */
@Getter
@AllArgsConstructor
public class ErrorResponse {
    private String message;
}
