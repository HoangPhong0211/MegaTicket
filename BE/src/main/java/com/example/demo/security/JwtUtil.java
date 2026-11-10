package com.example.demo.security;

import com.example.demo.entity.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

/**
 * Tiện ích xử lý JWT (JSON Web Token).
 *
 * JWT gồm 3 phần ngăn cách bởi dấu chấm:
 *   HEADER.PAYLOAD.SIGNATURE
 *
 * - HEADER: thuật toán ký (HS256)
 * - PAYLOAD: thông tin user được mã hóa (email, role, thời hạn...)
 * - SIGNATURE: chữ ký số, đảm bảo token không bị giả mạo
 *
 * Lưu ý: PAYLOAD chỉ được mã hóa Base64, KHÔNG được mã hoá,
 * nên đừng bao giờ bỏ thông tin nhạy cảm (password) vào JWT!
 */
@Component
@Slf4j
public class JwtUtil {

    // Đọc secret key và thời hạn từ application.properties
    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpirationMs;

    /**
     * Chuyển chuỗi secret thành đối tượng SecretKey (kiểu HMAC-SHA).
     * Phương thức này gọi lại mỗi lần cần dùng để tránh giữ state.
     */
    private SecretKey getSigningKey() {
        // Nếu secret ngắn hơn 32 ký tự, dùng Keys.hmacShaKeyFor với UTF-8 bytes
        // Nếu secret là Base64 -> dùng Decoders.BASE64.decode(jwtSecret)
        byte[] keyBytes = jwtSecret.getBytes();
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Tạo JWT từ thông tin User.
     *
     * Claims (thông tin trong payload):
     * - sub (subject): email của user - dùng để tra cứu user sau này
     * - role: quyền hạn USER / ADMIN - FE dùng để ẩn/hiện menu
     * - iat (issuedAt): thời điểm tạo token
     * - exp (expiration): thời điểm hết hạn
     */
    public String generateToken(User user) {
        return Jwts.builder()
                .subject(user.getEmail())                          // "sub": email
                .claim("role", user.getRole().name())              // custom claim: role
                .claim("fullName", user.getFullName())             // custom claim: tên hiển thị
                .issuedAt(new Date())                              // "iat": thời điểm tạo
                .expiration(new Date(System.currentTimeMillis() + jwtExpirationMs)) // "exp"
                .signWith(getSigningKey())                         // ký bằng HMAC-SHA256
                .compact();                                        // tạo chuỗi JWT cuối cùng
    }

    /**
     * Lấy email (subject) từ JWT.
     * Dùng trong JwtAuthFilter để biết đây là token của user nào.
     */
    public String extractEmail(String token) {
        return parseClaims(token).getSubject();
    }

    /**
     * Kiểm tra token có hợp lệ và chưa hết hạn không.
     * Trả về false nếu token bị giả mạo, hết hạn, hoặc sai cấu trúc.
     */
    public boolean isTokenValid(String token) {
        try {
            parseClaims(token); // nếu không throw exception thì token hợp lệ
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("JWT đã hết hạn: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.warn("JWT không được hỗ trợ: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            log.warn("JWT sai cấu trúc: {}", e.getMessage());
        } catch (SecurityException e) {
            log.warn("Chữ ký JWT không hợp lệ: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.warn("JWT rỗng hoặc null: {}", e.getMessage());
        }
        return false;
    }

    /**
     * Parse token và trả về Claims (toàn bộ payload).
     * Phương thức này đồng thời verify chữ ký - nếu sai sẽ throw exception.
     */
    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())   // dùng key để verify chữ ký
                .build()
                .parseSignedClaims(token)      // parse + verify
                .getPayload();                 // lấy phần payload (Claims)
    }
}
