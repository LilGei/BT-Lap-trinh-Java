package com.oism.tenant;

import org.hibernate.cfg.AvailableSettings;
import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.boot.autoconfigure.orm.jpa.HibernatePropertiesCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Hibernate 6 discriminator multi-tenancy: entity có @TenantId sẽ được TỰ ĐỘNG
 * lọc "tenant_id = ?" cho mọi query và tự điền khi INSERT (tương đương EF Core Global Query Filter).
 */
@Component
public class TenantIdentifierResolver implements CurrentTenantIdentifierResolver<UUID> {
    @Override
    public UUID resolveCurrentTenantIdentifier() {
        UUID t = TenantContext.get();
        return t != null ? t : TenantContext.NO_TENANT;
    }
    @Override
    public boolean validateExistingCurrentSessions() { return false; }

    @Configuration
    static class HibernateTenantConfig {
        @Bean
        HibernatePropertiesCustomizer tenantResolverCustomizer(TenantIdentifierResolver resolver) {
            return props -> props.put(AvailableSettings.MULTI_TENANT_IDENTIFIER_RESOLVER, resolver);
        }
    }
}
