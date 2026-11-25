package com.oism.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.UUID;

@Component
public class JwtTokenService {
    private final SecretKey key;

    public JwtTokenService(@Value("${oism.jwt.secret}") String secret) {
        byte[] bytes = Decoders.BASE64.decode(secret);
        if (bytes.length < 32) throw new IllegalArgumentException("JWT_SECRET must decode to at least 32 bytes");
        this.key = Keys.hmacShaKeyFor(bytes);
    }

    public CurrentUser parse(String token) {
        Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
        UUID tenantId = uuidClaim(claims, "tenantId", "tenant_id");
        UUID userId = uuidClaim(claims, "userId", "user_id", "id", "sub");
        if (userId == null && claims.getSubject() != null) {
            try { userId = UUID.fromString(claims.getSubject()); }
            catch (IllegalArgumentException ignored) { }
        }
        String role = claims.get("role", String.class);
        if (tenantId == null || userId == null || role == null) throw new IllegalArgumentException("JWT is missing required claims");
        String normalizedRole = role.startsWith("ROLE_") ? role.substring(5) : role;
        if (!normalizedRole.matches("OWNER|STAFF|CASHIER")) throw new IllegalArgumentException("Unknown role claim");
        return new CurrentUser(tenantId, userId, normalizedRole);
    }

    private static UUID uuidClaim(Claims claims, String... names) {
        for (String name : names) {
            Object value = claims.get(name);
            if (value != null) {
                try { return UUID.fromString(value.toString()); }
                catch (IllegalArgumentException ignored) { }
            }
        }
        return null;
    }
}
