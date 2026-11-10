package com.example.demo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * DTO trả về cho client sau khi đăng nhập / đăng ký thành công.
 *
 * Client sẽ lưu accessToken vào localStorage hoặc cookie
 * rồi gửi kèm mỗi request dưới dạng: Authorization: Bearer <token>
 */
@Getter
@Builder
@AllArgsConstructor
public class AuthResponse {

    private String accessToken;

    // Loại token - luôn là "Bearer" theo chuẩn OAuth2
    @Builder.Default
    private String tokenType = "Bearer";

    // Thông tin cơ bản của user để FE hiển thị (tên, role...)
    private String fullName;
    private String email;
    private String role;
}
