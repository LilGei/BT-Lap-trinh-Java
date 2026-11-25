package com.oism.order;

import com.oism.security.CurrentUser;
import com.oism.common.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
class FlashSaleConcurrencyTest {
    @Container static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16");
    @DynamicPropertySource static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("oism.jwt.secret", () -> "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=");
    }

    @Autowired JdbcTemplate jdbc;
    @Autowired OrderService orders;
    UUID tenant;
    UUID branch;
    UUID sku;
    CurrentUser user;

    @BeforeEach void seedOneAvailableUnit() {
        tenant = UUID.randomUUID(); branch = UUID.randomUUID(); sku = UUID.randomUUID();
        UUID category = UUID.randomUUID(); UUID product = UUID.randomUUID();
        jdbc.update("insert into tenants(id,domain,name,status) values(?,?,?,'ACTIVE')", tenant, "t-" + tenant, "Concurrency test");
        jdbc.update("insert into branches(id,tenant_id,code,name) values(?,?,?,?)", branch, tenant, "B1", "Test branch");
        jdbc.update("insert into categories(id,tenant_id,name) values(?,?,?)", category, tenant, "Test");
        jdbc.update("insert into products(id,tenant_id,category_id,name) values(?,?,?,?)", product, tenant, category, "Test product");
        jdbc.update("insert into product_variants(id,tenant_id,product_id,sku_code,current_average_cost,retail_price,wholesale_price) values(?,?,?,?,?,?,?)",
                sku, tenant, product, "SKU-" + sku, new BigDecimal("4.0000"), new BigDecimal("10.00"), new BigDecimal("8.00"));
        jdbc.update("insert into stock_balances(tenant_id,branch_id,sku_id,on_hand,reserved) values(?,?,?,1,0)", tenant, branch, sku);
        user = new CurrentUser(tenant, null, "CASHIER");
    }

    @Test void fiftyConcurrentOrdersCannotReserveMoreThanOneUnit() throws Exception {
        var pool = Executors.newFixedThreadPool(50);
        try {
            AtomicInteger accepted = new AtomicInteger();
            AtomicInteger rejected = new AtomicInteger();
            List<Callable<Void>> requests = java.util.stream.IntStream.range(0, 50).<Callable<Void>>mapToObj(i -> () -> {
                try {
                    orders.create(user, new OrderRequests.CreateOrder(branch, "SHOPEE", "E-" + i, "Flash sale", null,
                            BigDecimal.ZERO, List.of(new OrderRequests.Line(sku, BigDecimal.ONE))));
                    accepted.incrementAndGet();
                } catch (BusinessException expectedWhenStockIsReserved) {
                    assertEquals(409, expectedWhenStockIsReserved.status().value());
                    rejected.incrementAndGet();
                }
                return null;
            }).toList();
            for (var result : pool.invokeAll(requests)) result.get();
            pool.shutdown();
            assertTrue(pool.awaitTermination(30, TimeUnit.SECONDS));
            assertEquals(1, accepted.get());
            assertEquals(49, rejected.get());
            BigDecimal onHand = jdbc.queryForObject("select on_hand from stock_balances where tenant_id=? and branch_id=? and sku_id=?", BigDecimal.class, tenant, branch, sku);
            BigDecimal reserved = jdbc.queryForObject("select reserved from stock_balances where tenant_id=? and branch_id=? and sku_id=?", BigDecimal.class, tenant, branch, sku);
            assertEquals(0, onHand.compareTo(BigDecimal.ONE));
            assertEquals(0, reserved.compareTo(BigDecimal.ONE));
            assertTrue(onHand.compareTo(reserved) >= 0);
        } finally {
            pool.shutdownNow();
        }
    }
}
