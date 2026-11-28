package com.oism.security;

import com.oism.auth.AuthUser;

import java.util.UUID;

public record CurrentUser(UUID tenantId, UUID userId, String role) implements AuthUser {
    public boolean hasRole(String expected) { return role.equals(expected); }
}
