package com.example.demo.exception;

import com.example.demo.dto.response.ErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * Xử lý tập trung tất cả exception trong ứng dụng.
 *
 * @RestControllerAdvice = @ControllerAdvice + @ResponseBody
 * Nghĩa là mọi exception được throw từ bất kỳ Controller nào
 * đều sẽ bị "chặn" tại đây và được xử lý thành JSON response thống nhất.
 *
 * Thay vì client nhận được stack trace thô xấu xí, họ nhận được:
 * { "message": "Email đã được sử dụng" }
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Bắt lỗi nghiệp vụ (BusinessException).
     * HTTP 400 Bad Request.
     */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusinessException(BusinessException ex) {
        return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
    }

    /**
     * Bắt lỗi validation từ @Valid.
     * Khi request body không thỏa mãn @NotBlank, @Email, @Size...
     * Spring throw MethodArgumentNotValidException.
     *
     * Response: map field → message lỗi, HTTP 400.
     * Ví dụ: { "email": "Email không đúng định dạng", "password": "..." }
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationException(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }
        return ResponseEntity.badRequest().body(errors);
    }

    /**
     * Bắt mọi exception không được xử lý ở trên.
     * HTTP 500 Internal Server Error.
     * Log lỗi để debug, nhưng không lộ chi tiết ra ngoài.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralException(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Lỗi hệ thống, vui lòng thử lại sau."));
    }
}
