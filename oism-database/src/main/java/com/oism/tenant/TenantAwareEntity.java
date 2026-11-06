package com.oism.tenant;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import org.hibernate.annotations.TenantId;

import java.util.UUID;

/** Base class cho mọi entity nghiệp vụ: bắt buộc có tenant_id, do Hibernate quản lý. */
@MappedSuperclass
@Getter
public abstract class TenantAwareEntity {
    @TenantId
    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;
}
