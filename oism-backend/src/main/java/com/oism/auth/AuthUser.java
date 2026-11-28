package com.oism.auth;

import java.util.UUID;

/**
 * Principal của request đã xác thực. {@link com.oism.security.CurrentUser} (của BE3) implement interface này
 * nên controller của BE1/BE2 dùng {@code @AuthenticationPrincipal AuthUser} còn BE3 dùng {@code CurrentUser}.
 */
public interface AuthUser {
    UUID tenantId();
    UUID userId();
    /** OWNER | STAFF | CASHIER (không có tiền tố ROLE_). */
    String role();
}
