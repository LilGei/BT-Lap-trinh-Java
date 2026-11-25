package com.oism.report;

import com.oism.realtime.OrderEvents;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Component
public class LowStockAlertJob {
    private final NamedParameterJdbcTemplate jdbc;
    private final OrderEvents events;

    public LowStockAlertJob(NamedParameterJdbcTemplate jdbc, OrderEvents events) {
        this.jdbc = jdbc;
        this.events = events;
    }

    @Scheduled(fixedDelayString = "${LOW_STOCK_ALERT_DELAY_MS:300000}")
    @Transactional
    public void publishLowStockAlerts() {
        var rows = jdbc.queryForList("""
                select s.tenant_id as \"tenantId\",s.branch_id as \"branchId\",s.sku_id as \"skuId\",
                       v.sku_code as sku,(s.on_hand-s.reserved) as available,v.reorder_threshold as threshold
                from stock_balances s join product_variants v on v.id=s.sku_id and v.tenant_id=s.tenant_id
                where s.on_hand-s.reserved<=v.reorder_threshold and v.is_active=true
                """, Map.of());
        for (var row : rows) {
            UUID tenant = (UUID) row.get("tenantId");
            UUID skuId = (UUID) row.get("skuId");
            Integer existing = jdbc.queryForObject("""
                    select count(*) from notifications where tenant_id=:tenant and reference_id=:sku
                      and type='LOW_STOCK' and created_at>now()-interval '6 hours'
                    """, Map.of("tenant", tenant, "sku", skuId), Integer.class);
            if (existing != null && existing > 0) continue;
            String title = "Low stock: " + row.get("sku");
            String message = "Available quantity " + row.get("available") + " is at or below reorder threshold " + row.get("threshold") + " (branch " + row.get("branchId") + ")";
            UUID notificationId = UUID.randomUUID();
            jdbc.update("""
                    insert into notifications (id,tenant_id,type,message,is_read,title,reference_id)
                    values (:id,:tenant,'LOW_STOCK',:message,false,:title,:sku)
                    """, Map.of("id", notificationId, "tenant", tenant, "message", message, "title", title, "sku", skuId));
            events.publishAfterCommit(tenant, "LOW_STOCK", Map.of("notificationId", notificationId, "skuId", skuId,
                    "sku", row.get("sku"), "available", row.get("available"), "threshold", row.get("threshold")));
        }
    }
}
