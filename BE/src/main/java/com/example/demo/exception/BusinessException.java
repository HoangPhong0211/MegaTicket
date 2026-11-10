package com.example.demo.exception;

/**
 * Exception tùy chỉnh cho các lỗi nghiệp vụ (business logic).
 *
 * Ví dụ: email đã tồn tại, sai mật khẩu, không tìm thấy tài nguyên...
 * Khác với RuntimeException thông thường ở chỗ nó mang ngữ nghĩa rõ ràng
 * và sẽ được GlobalExceptionHandler bắt để trả về HTTP 400.
 */
public class BusinessException extends RuntimeException {

    public BusinessException(String message) {
        super(message);
    }
}
