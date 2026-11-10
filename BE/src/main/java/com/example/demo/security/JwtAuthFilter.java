package com.example.demo.security;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Filter JWT - chạy MỘT LẦN cho mỗi HTTP request (OncePerRequestFilter).
 *
 * Luồng hoạt động:
 *   Request đến → Filter chạy → Trích xuất JWT từ header
 *       → Validate token → Tìm user trong DB → Gán authentication vào SecurityContext
 *           → Request được tiếp tục xử lý bởi Controller
 *
 * Nếu không có token hoặc token lỗi → Filter bỏ qua, SecurityContext trống
 * → Spring Security sẽ từ chối request nếu endpoint yêu cầu xác thực.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // Bước 1: Trích xuất token từ header "Authorization: Bearer <token>"
        String token = extractTokenFromRequest(request);

        // Bước 2: Nếu có token và token hợp lệ → xác thực user
        if (StringUtils.hasText(token) && jwtUtil.isTokenValid(token)) {

            // Bước 3: Lấy email từ payload của JWT
            String email = jwtUtil.extractEmail(token);

            // Bước 4: Tìm user trong database bằng email
            // Lý do phải tra DB: để kiểm tra user còn tồn tại và lấy role hiện tại
            User user = userRepository.findByEmail(email).orElse(null);

            if (user != null) {
                // Bước 5: Tạo đối tượng Authentication với role của user
                // "ROLE_" prefix là quy ước của Spring Security
                var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));

                var authentication = new UsernamePasswordAuthenticationToken(
                        user,          // principal: đối tượng user (có thể lấy bằng SecurityUtils)
                        null,          // credentials: null vì đã xác thực qua JWT
                        authorities    // quyền hạn: [ROLE_USER] hoặc [ROLE_ADMIN]
                );

                // Gán thêm thông tin request (IP, session...) vào authentication
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // Bước 6: Đưa authentication vào SecurityContext
                // Từ đây, Spring Security biết request này đã được xác thực
                SecurityContextHolder.getContext().setAuthentication(authentication);

                log.debug("Xác thực thành công cho user: {}", email);
            }
        }

        // Bước 7: Tiếp tục chuỗi filter (dù có xác thực hay không)
        filterChain.doFilter(request, response);
    }

    /**
     * Trích xuất JWT từ header Authorization.
     * Header có dạng: "Authorization: Bearer eyJhbGci..."
     * Ta cần lấy phần sau "Bearer " (7 ký tự).
     */
    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7); // Cắt bỏ "Bearer "
        }
        return null;
    }
}
