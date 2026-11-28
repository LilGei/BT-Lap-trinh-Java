package com.oism.auth;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public final class AuthDtos {
    private AuthDtos() {}

    /** FR-AUTH-01: đăng ký cửa hàng (tenant) + tài khoản Owner đầu tiên. */
    public record RegisterTenantRequest(
            @NotBlank @Pattern(regexp = "^[A-Za-z0-9][A-Za-z0-9-]{2,49}$",
                    message = "tenantCode gồm chữ, số, dấu gạch ngang; dài 3-50 ký tự") String tenantCode,
            @NotBlank @Size(max = 200) String storeName,
            @NotBlank @Size(max = 200) String ownerName,
            @NotBlank @Email @Size(max = 255) String email,
            @Size(max = 30) String phone,
            @NotBlank @Size(min = 8, max = 72, message = "mật khẩu 8-72 ký tự") String password) {}

    /** FR-AUTH-02: đăng nhập bằng email hoặc số điện thoại. */
    public record LoginRequest(
            @NotBlank @JsonAlias({"email", "phone", "username"}) String identifier,
            @NotBlank String password) {}

    public record RefreshRequest(@NotBlank String refreshToken) {}

    public record AuthResponse(String accessToken, String refreshToken, String tokenType, long expiresIn,
                               UUID userId, UUID tenantId, String role, String fullName) {}

    public record MeResponse(UUID userId, UUID tenantId, String role, String fullName,
                             String email, String phone, List<UUID> branchIds) {}
}
