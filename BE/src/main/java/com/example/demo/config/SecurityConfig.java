package com.example.demo.config;

import com.example.demo.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.example.demo.repository.UserRepository;

/**
 * Cấu hình bảo mật trung tâm của ứng dụng.
 *
 * Hai annotation quan trọng:
 * - @EnableWebSecurity: bật Spring Security cho toàn ứng dụng
 * - @EnableMethodSecurity: cho phép dùng @PreAuthorize("hasRole('ADMIN')") trên method
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final UserRepository userRepository;

    /**
     * Bean mã hóa mật khẩu dùng thuật toán BCrypt.
     *
     * BCrypt tự động thêm "salt" ngẫu nhiên vào mỗi lần hash,
     * nên cùng một mật khẩu sẽ cho ra hash khác nhau mỗi lần.
     * Điều này giúp chống tấn công rainbow table.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * UserDetailsService: Spring Security dùng để load thông tin user khi authenticate.
     * Ta implement inline bằng lambda thay vì tạo class riêng để giữ code gọn.
     */
    @Bean
    public UserDetailsService userDetailsService() {
        return username -> userRepository.findByEmail(username)
                .map(user -> org.springframework.security.core.userdetails.User
                        .withUsername(user.getEmail())
                        .password(user.getPasswordHash())
                        .roles(user.getRole().name()) // tự thêm prefix "ROLE_"
                        .build())
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy user: " + username));
    }

    /**
     * AuthenticationProvider: liên kết UserDetailsService + PasswordEncoder.
     * Spring Security 7+ yêu cầu truyền UserDetailsService qua constructor
     * thay vì setter như các phiên bản trước.
     */
    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        // Spring Security 7: constructor nhận UserDetailsService bắt buộc
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService());
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    /**
     * AuthenticationManager: entry point để trigger quá trình xác thực.
     * AuthService sẽ inject bean này và gọi authenticate().
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * Cấu hình chuỗi filter bảo mật - đây là "trái tim" của Security config.
     *
     * Thứ tự quan trọng:
     * 1. Tắt CSRF (REST API không dùng session nên không cần)
     * 2. Tắt Session (dùng JWT stateless thay thế)
     * 3. Khai báo quy tắc phân quyền từng endpoint
     * 4. Thêm JwtAuthFilter VÀO TRƯỚC UsernamePasswordAuthenticationFilter
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Tắt CSRF: REST API không dùng form-based authentication
            .csrf(AbstractHttpConfigurer::disable)

            // Stateless: không lưu session, mỗi request phải mang JWT
            .sessionManagement(session ->
                    session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // Quy tắc phân quyền theo endpoint
            .authorizeHttpRequests(auth -> auth
                    // Public: ai cũng truy cập được (đăng ký, đăng nhập)
                    .requestMatchers("/api/auth/**").permitAll()

                    // Public: xem danh sách và chi tiết sự kiện (không cần đăng nhập)
                    .requestMatchers(HttpMethod.GET, "/api/events/**").permitAll()

                    // Admin only: quản lý sự kiện, đơn hàng, check-in
                    .requestMatchers("/api/admin/**").hasRole("ADMIN")

                    // Còn lại: phải đăng nhập (có JWT hợp lệ)
                    .anyRequest().authenticated()
            )

            // Dùng DaoAuthenticationProvider đã cấu hình ở trên
            .authenticationProvider(authenticationProvider())

            // Thêm JwtAuthFilter vào TRƯỚC filter xác thực mặc định của Spring
            // Nhờ đó mỗi request sẽ được kiểm tra JWT trước tiên
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
