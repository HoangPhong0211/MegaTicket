package com.example.demo.service;

import com.example.demo.dto.request.LoginRequest;
import com.example.demo.dto.request.RegisterRequest;
import com.example.demo.dto.response.AuthResponse;
import com.example.demo.entity.User;
import com.example.demo.exception.BusinessException;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service xử lý nghiệp vụ xác thực người dùng.
 *
 * Nguyên tắc tách lớp:
 * - Controller: nhận request, trả response (HTTP layer)
 * - Service: xử lý business logic (domain layer)
 * - Repository: truy cập database (data layer)
 *
 * Service không biết gì về HTTP (không có HttpServletRequest, ResponseEntity...).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    /**
     * Đăng ký tài khoản mới.
     *
     * Luồng:
     * 1. Kiểm tra email đã tồn tại chưa
     * 2. Hash mật khẩu bằng BCrypt
     * 3. Lưu user vào DB
     * 4. Tạo JWT và trả về
     *
     * @Transactional: nếu bước nào thất bại thì rollback toàn bộ,
     * tránh lưu user nhưng không có JWT (inconsistent state).
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Bước 1: Kiểm tra email trùng
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Email '" + request.getEmail() + "' đã được sử dụng.");
        }

        // Bước 2: Tạo entity User, hash password trước khi lưu
        // Không bao giờ lưu mật khẩu plain text vào DB!
        User newUser = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword())) // BCrypt hash
                .phone(request.getPhone())
                // role mặc định là USER (đã khai báo @Builder.Default trong entity)
                .build();

        // Bước 3: Lưu vào DB
        userRepository.save(newUser);
        log.info("Đăng ký thành công cho email: {}", newUser.getEmail());

        // Bước 4: Tạo JWT và trả về response
        String token = jwtUtil.generateToken(newUser);
        return buildAuthResponse(token, newUser);
    }

    /**
     * Đăng nhập.
     *
     * Luồng:
     * 1. Dùng AuthenticationManager để verify email + password
     *    (nó sẽ load user từ DB và so sánh BCrypt hash)
     * 2. Nếu đúng → tạo JWT
     * 3. Nếu sai → BadCredentialsException → throw BusinessException
     */
    public AuthResponse login(LoginRequest request) {
        try {
            // Spring Security tự xử lý: load user, verify BCrypt, check account status...
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (BadCredentialsException e) {
            // Ném lỗi chung chung để không lộ thông tin (email không tồn tại vs sai mật khẩu)
            throw new BusinessException("Email hoặc mật khẩu không chính xác.");
        }

        // Nếu authenticate() không throw → thông tin đúng → tạo JWT
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BusinessException("Không tìm thấy người dùng."));

        log.info("Đăng nhập thành công cho email: {}", user.getEmail());

        String token = jwtUtil.generateToken(user);
        return buildAuthResponse(token, user);
    }

    /**
     * Tạo AuthResponse từ token và thông tin user.
     * Tách ra phương thức riêng vì cả register() và login() đều dùng.
     */
    private AuthResponse buildAuthResponse(String token, User user) {
        return AuthResponse.builder()
                .accessToken(token)
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }
}
