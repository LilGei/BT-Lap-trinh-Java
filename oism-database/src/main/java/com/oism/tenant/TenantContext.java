package com.oism.tenant;

import java.util.UUID;

/** Giữ TenantId của request hiện tại (set từ JWT, clear sau request). */
public final class TenantContext {
    /** Sentinel: không có tenant -> mọi truy vấn bảng tenant-scoped trả về rỗng. */
    public static final UUID NO_TENANT = new UUID(0L, 0L);
    private static final ThreadLocal<UUID> CURRENT = new ThreadLocal<>();

    private TenantContext() {}
    public static void set(UUID tenantId) { CURRENT.set(tenantId); }
    public static UUID get() { return CURRENT.get(); }
    public static UUID require() {
        UUID t = CURRENT.get();
        if (t == null) throw new IllegalStateException("No tenant in context");
        return t;
    }
    public static void clear() { CURRENT.remove(); }
}
