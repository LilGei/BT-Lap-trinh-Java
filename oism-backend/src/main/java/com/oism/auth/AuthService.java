package com.oism.auth;

import com.oism.auth.AuthDtos.*;
import com.oism.common.BusinessException;
import com.oism.tenant.Tenant;
import com.oism.tenant.TenantRepository;
import com.oism.tenant.TenantStatus;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * FR-AUTH: đăng ký tenant, đăng nhập, refresh (xoay vòng + phát hiện dùng lại), đăng xuất.
 * Các bảng users / refresh_tokens / tenants KHÔNG gắn @TenantId nên service này chạy được khi chưa có TenantContext.
 */
@Service
@RequiredArgsConstructor
public class AuthService {
    private static final SecureRandom RANDOM = new SecureRandom();

    private final TenantRepository tenants;
    private final UserRepository users;
    private final RoleRepository roles;
    private final RefreshTokenRepository refreshTokens;
    private final UserBranchRepository userBranches;
    private final PasswordEncoder encoder;
    private final JwtIssuer jwt;

    @Value("${oism.jwt.refresh-days:7}")
    private long refreshDays = 7;

    @PersistenceContext
    private EntityManager em;

    @Transactional
    public AuthResponse registerTenant(RegisterTenantRequest r) {
        String domain = r.tenantCode().trim().toLowerCase(Locale.ROOT);
        String email = r.email().trim().toLowerCase(Locale.ROOT);
        String phone = blankToNull(r.phone());

        if (tenants.existsByDomainIgnoreCase(domain)) throw BusinessException.conflict("Tenant code already exists");
        if (users.existsByEmailIgnoreCase(email)) throw BusinessException.conflict("Email already in use");
        if (phone != null && users.existsByPhone(phone)) throw BusinessException.conflict("Phone already in use");

        Tenant tenant = new Tenant();
        tenant.setName(r.storeName().trim());
        tenant.setDomain(domain);
        tenant = tenants.save(tenant);

        Role ownerRole = roles.findByName(RoleName.OWNER)
                .orElseThrow(() -> new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR, "Role OWNER is not seeded (run Flyway V3)"));
        User owner = new User();
        owner.setTenantId(tenant.getId());
        owner.setRole(ownerRole);
        owner.setEmail(email);
        owner.setPhone(phone);
        owner.setFullName(r.ownerName().trim());
        owner.setPasswordHash(encoder.encode(r.password()));
        owner = users.save(owner);

        return issue(owner);
    }

    @Transactional
    public AuthResponse login(LoginRequest r) {
        String id = r.identifier().trim();
        User user = users.findByIdentifier(id).orElseThrow(AuthService::badCredentials);
        if (!encoder.matches(r.password(), user.getPasswordHash())) throw badCredentials();
        requireActive(user);
        return issue(user);
    }

    /** noRollbackFor: khi phát hiện token bị dùng lại, việc thu hồi toàn bộ token phải được COMMIT dù ném lỗi 401. */
    @Transactional(noRollbackFor = BusinessException.class)
    public AuthResponse refresh(String rawToken) {
        RefreshToken stored = refreshTokens.findByTokenHash(sha256(rawToken)).orElseThrow(AuthService::invalidRefresh);
        if (stored.isRevoked()) {              // token đã xoay vòng mà vẫn bị đem ra dùng -> nghi bị đánh cắp
            revokeAll(stored.getUserId());
            throw invalidRefresh();
        }
        if (stored.getExpiresAt().isBefore(Instant.now())) throw invalidRefresh();
        User user = users.findById(stored.getUserId()).orElseThrow(AuthService::invalidRefresh);
        requireActive(user);
        stored.setRevoked(true);
        return issue(user);
    }

    @Transactional
    public void logout(String rawToken) {
        refreshTokens.findByTokenHash(sha256(rawToken)).ifPresent(t -> t.setRevoked(true));
    }

    @Transactional(readOnly = true)
    public MeResponse me(AuthUser me) {
        User u = users.findById(me.userId()).orElseThrow(() -> BusinessException.notFound("User not found"));
        List<UUID> branchIds = userBranches.findByUserId(u.getId()).stream().map(UserBranch::getBranchId).toList();
        return new MeResponse(u.getId(), u.getTenantId(), u.getRole().getName().name(),
                u.getFullName(), u.getEmail(), u.getPhone(), branchIds);
    }

    // ------------------------------------------------------------------ helpers

    private void requireActive(User user) {
        if (!user.isActive()) throw new BusinessException(HttpStatus.FORBIDDEN, "Account is inactive");
        Tenant tenant = tenants.findById(user.getTenantId()).orElseThrow(AuthService::badCredentials);
        if (tenant.getStatus() != TenantStatus.ACTIVE) throw new BusinessException(HttpStatus.FORBIDDEN, "Store is suspended");
    }

    private AuthResponse issue(User user) {
        String role = user.getRole().getName().name();
        String access = jwt.issue(user.getId(), user.getTenantId(), role);

        byte[] bytes = new byte[48];
        RANDOM.nextBytes(bytes);
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        RefreshToken rt = new RefreshToken();
        rt.setTenantId(user.getTenantId());
        rt.setUserId(user.getId());
        rt.setTokenHash(sha256(raw));
        rt.setExpiresAt(Instant.now().plus(refreshDays, ChronoUnit.DAYS));
        refreshTokens.save(rt);

        return new AuthResponse(access, raw, "Bearer", jwt.accessTtlSeconds(),
                user.getId(), user.getTenantId(), role, user.getFullName());
    }

    private void revokeAll(UUID userId) {
        em.createQuery("update RefreshToken t set t.revoked = true where t.userId = :uid and t.revoked = false")
                .setParameter("uid", userId).executeUpdate();
    }

    static String sha256(String raw) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private static String blankToNull(String s) { return s == null || s.isBlank() ? null : s.trim(); }

    private static BusinessException badCredentials() { return new BusinessException(HttpStatus.UNAUTHORIZED, "Invalid credentials"); }

    private static BusinessException invalidRefresh() { return new BusinessException(HttpStatus.UNAUTHORIZED, "Invalid or expired refresh token"); }
}
