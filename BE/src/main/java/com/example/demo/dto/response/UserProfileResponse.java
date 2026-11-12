package com.example.demo.dto.response;

import com.example.demo.entity.enums.Role;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * DTO trả về thông tin hồ sơ cá nhân của user (không chứa passwordHash).
 */
@Getter
@Builder
public class UserProfileResponse {

    private UUID id;
    private String email;
    private String fullName;
    private String phone;
    private Role role;
    private OffsetDateTime createdAt;
}
