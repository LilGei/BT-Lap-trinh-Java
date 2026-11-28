package com.oism.auth;

import com.oism.security.CurrentUser;
import com.oism.security.JwtTokenService;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.Test;

import java.util.Base64;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/** Chứng minh token do BE1 (JwtIssuer) phát ra được bộ lọc xác thực của BE3 (JwtTokenService) đọc đúng. */
class JwtIssuerCompatibilityTest {
    private static final String SECRET = Base64.getEncoder().encodeToString("0123456789abcdef0123456789abcdef".getBytes());

    @Test
    void tokenIssuedByBe1IsParsedByBe3() {
        JwtIssuer issuer = new JwtIssuer(SECRET, 30);
        JwtTokenService parser = new JwtTokenService(SECRET);
        UUID userId = UUID.randomUUID(), tenantId = UUID.randomUUID();

        CurrentUser cu = parser.parse(issuer.issue(userId, tenantId, "STAFF"));

        assertEquals(userId, cu.userId());
        assertEquals(tenantId, cu.tenantId());
        assertEquals("STAFF", cu.role());
        assertEquals(1800, issuer.accessTtlSeconds());
    }

    @Test
    void tokenSignedWithAnotherKeyIsRejected() {
        String other = Base64.getEncoder().encodeToString("ffffffffffffffffffffffffffffffff".getBytes());
        String token = new JwtIssuer(other, 30).issue(UUID.randomUUID(), UUID.randomUUID(), "OWNER");
        assertThrows(JwtException.class, () -> new JwtTokenService(SECRET).parse(token));
    }

    @Test
    void shortSecretIsRefused() {
        String tooShort = Base64.getEncoder().encodeToString("short".getBytes());
        assertThrows(IllegalArgumentException.class, () -> new JwtIssuer(tooShort, 30));
    }

    @Test
    void refreshTokenHashIsStableHex64() {
        String h = AuthService.sha256("abc");
        assertEquals(64, h.length());
        assertEquals(h, AuthService.sha256("abc"));
        assertNotEquals(h, AuthService.sha256("abd"));
    }
}
