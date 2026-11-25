package com.oism.security;

import java.util.UUID;

public record CurrentUser(UUID tenantId, UUID userId, String role) {
    public boolean hasRole(String expected) { return role.equals(expected); }
}
