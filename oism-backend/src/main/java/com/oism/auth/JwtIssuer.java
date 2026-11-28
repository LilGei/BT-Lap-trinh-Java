package com.oism.auth;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

/**
 * Phát hành access token. Dùng CHUNG khoá {@code oism.jwt.secret} (Base64, >= 32 byte) với
 * {@link com.oism.security.JwtTokenService} (BE3 - phía xác thực) nên token phát ra ở đây luôn được filter chấp nhận.
 * Claims: sub = userId, userId, tenantId, role (OWNER | STAFF | CASHIER).
 */
@Component
public class JwtIssuer {
    private final SecretKey key;
    private final long accessMinutes;

    public JwtIssuer(@Value("${oism.jwt.secret}") String secret,
                     @Value("${oism.jwt.access-minutes:30}") long accessMinutes) {
        byte[] bytes = Decoders.BASE64.decode(secret);
        if (bytes.length < 32) throw new IllegalArgumentException("JWT_SECRET must decode to at least 32 bytes");
        this.key = Keys.hmacShaKeyFor(bytes);
        this.accessMinutes = accessMinutes;
    }

    public long accessTtlSeconds() { return accessMinutes * 60; }

    public String issue(UUID userId, UUID tenantId, String role) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userId.toString())
                .claim("userId", userId.toString())
                .claim("tenantId", tenantId.toString())
                .claim("role", role)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(accessTtlSeconds())))
                .signWith(key)
                .compact();
    }
}
