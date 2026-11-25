package com.oism.order;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.oism.common.BusinessException;
import com.oism.realtime.OrderEvents;
import com.oism.security.CurrentUser;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class OrderService {
    private static final BigDecimal ZERO = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    private static final List<String> CHANNELS = List.of("POS", "ADMIN", "SHOPEE", "TIKTOK", "LAZADA");
    private final NamedParameterJdbcTemplate jdbc;
    private final ObjectMapper mapper;
    private final OrderEvents events;
    private final int reservationMinutes;

    public OrderService(NamedParameterJdbcTemplate jdbc, ObjectMapper mapper, OrderEvents events,
                        @Value("${oism.orders.reservation-minutes:15}") int reservationMinutes) {
        this.jdbc = jdbc;
        this.mapper = mapper;
        this.events = events;
        this.reservationMinutes = reservationMinutes;
    }

    @Transactional
    public Map<String, Object> create(CurrentUser user, OrderRequests.CreateOrder request) {
        String channel = normalizeChannel(request.channel());
        return createReserved(user, request.branchId(), channel, request.externalOrderId(), request.customerName(),
                request.customerPhone(), request.discount(), request.items());
    }

    @Transactional
    public Map<String, Object> webhook(CurrentUser user, String channel, OrderRequests.WebhookOrder request) {
        channel = normalizeChannel(channel);
        if ("POS".equals(channel) || "ADMIN".equals(channel)) throw BusinessException.badRequest("Webhook channel must be SHOPEE, TIKTOK, or LAZADA");
        if (request.externalOrderId() == null || request.externalOrderId().isBlank())
            throw BusinessException.badRequest("externalOrderId is required for idempotent webhook ingestion");
        var existing = jdbc.query("""
                select id from orders where tenant_id=:tenant and channel=:channel and external_order_id=:external
                """, Map.of("tenant", user.tenantId(), "channel", channel, "external", request.externalOrderId()), (rs, row) -> rs.getObject("id", UUID.class));
        if (!existing.isEmpty()) return getOrder(user, existing.getFirst());

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("externalOrderId", request.externalOrderId());
        payload.put("branchId", request.branchId());
        payload.put("customerName", request.customerName());
        payload.put("items", request.items());
        String json;
        try { json = mapper.writeValueAsString(payload); }
        catch (JsonProcessingException e) { throw BusinessException.badRequest("Webhook payload is invalid"); }
        int claimed = jdbc.update("""
                insert into webhook_events (tenant_id, channel, external_order_id, payload, status)
                values (:tenant,:channel,:external,cast(:payload as jsonb),'RECEIVED')
                on conflict (tenant_id,channel,external_order_id) do nothing
                """, Map.of("tenant", user.tenantId(), "channel", channel, "external", request.externalOrderId(), "payload", json));
        if (claimed == 0) {
            var duplicate = jdbc.query("""
                    select id from orders where tenant_id=:tenant and channel=:channel and external_order_id=:external
                    """, Map.of("tenant", user.tenantId(), "channel", channel, "external", request.externalOrderId()),
                    (rs, row) -> rs.getObject("id", UUID.class));
            if (!duplicate.isEmpty()) return getOrder(user, duplicate.getFirst());
            throw BusinessException.conflict("Webhook event is already being processed");
        }
        Map<String, Object> order = createReserved(user, request.branchId(), channel, request.externalOrderId(),
                request.customerName(), request.customerPhone(), request.discount(), request.items());
        jdbc.update("""
                update webhook_events set status='PROCESSED', processed_at=now()
                where tenant_id=:tenant and channel=:channel and external_order_id=:external
                """, Map.of("tenant", user.tenantId(), "channel", channel, "external", request.externalOrderId()));
        return order;
    }

    @Transactional
    public Map<String, Object> checkout(CurrentUser user, OrderRequests.Checkout request) {
        String method = request.paymentMethod().trim().toUpperCase();
        if (!List.of("CASH", "QR_TRANSFER").contains(method)) throw BusinessException.badRequest("paymentMethod must be CASH or QR_TRANSFER");
        Map<String, Object> order = createReserved(user, request.branchId(), "POS", null, request.customerName(),
                request.customerPhone(), request.discount(), request.items());
        UUID orderId = (UUID) order.get("id");
        confirm(user, orderId);
        jdbc.update("""
                insert into payments (tenant_id, order_id, method, amount, status, paid_at)
                values (:tenant,:orderId,:method,:amount,'PAID',now())
                """, Map.of("tenant", user.tenantId(), "orderId", orderId, "method", method, "amount", order.get("totalAmount")));
        changeStatus(user, orderId, OrderStatus.COMPLETED);
        events.publishAfterCommit(user.tenantId(), "POS_CHECKOUT", Map.of("orderId", orderId, "orderCode", order.get("orderCode"), "status", "COMPLETED"));
        return getOrder(user, orderId);
    }

    @Transactional
    public Map<String, Object> transition(CurrentUser user, UUID orderId, String rawStatus) {
        OrderStatus next;
        try { next = OrderStatus.valueOf(rawStatus.trim().toUpperCase()); }
        catch (RuntimeException ex) { throw BusinessException.badRequest("Unsupported order status"); }
        OrderStatus current = lockOrderStatus(user, orderId);
        current.requireTransitionTo(next);
        if (next == OrderStatus.RESERVED) reserve(user, orderId);
        else if (next == OrderStatus.CONFIRMED) confirm(user, orderId);
        else if (next == OrderStatus.CANCELLED) cancel(user, orderId, current);
        else changeStatus(user, orderId, next);
        events.publishAfterCommit(user.tenantId(), "ORDER_STATUS_CHANGED", Map.of("orderId", orderId, "status", next.name()));
        return getOrder(user, orderId);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> list(CurrentUser user, UUID branchId, String status, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 200));
        StringBuilder sql = new StringBuilder("select id, order_code as \"orderCode\", branch_id as \"branchId\", channel, status, customer_name as \"customerName\", total_amount as \"totalAmount\", created_at as \"createdAt\" from orders where tenant_id=:tenant");
        MapSqlParameterSource params = new MapSqlParameterSource("tenant", user.tenantId()).addValue("limit", safeLimit);
        if (branchId != null) { sql.append(" and branch_id=:branch"); params.addValue("branch", branchId); }
        if (status != null && !status.isBlank()) {
            try { OrderStatus.valueOf(status.toUpperCase()); }
            catch (IllegalArgumentException ex) { throw BusinessException.badRequest("Unsupported order status filter"); }
            sql.append(" and status=:status"); params.addValue("status", status.toUpperCase());
        }
        sql.append(" order by created_at desc limit :limit");
        return jdbc.queryForList(sql.toString(), params);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getOrder(CurrentUser user, UUID orderId) {
        Map<String, Object> order = jdbc.query("""
                select id, tenant_id as \"tenantId\", branch_id as \"branchId\", order_code as \"orderCode\", channel,
                       external_order_id as \"externalOrderId\", status, customer_name as \"customerName\",
                       customer_phone as \"customerPhone\", total_amount as \"totalAmount\", created_at as \"createdAt\",
                       confirmed_at as \"confirmedAt\"
                from orders where tenant_id=:tenant and id=:id
                """, Map.of("tenant", user.tenantId(), "id", orderId), rs -> {
            if (!rs.next()) return null;
            Map<String, Object> row = new LinkedHashMap<>();
            for (String key : List.of("id", "tenantId", "branchId", "orderCode", "channel", "externalOrderId", "status", "customerName", "customerPhone", "totalAmount", "createdAt", "confirmedAt")) row.put(key, rs.getObject(key));
            return row;
        });
        if (order == null) throw BusinessException.notFound("Order not found");
        order.put("items", jdbc.queryForList("""
                select sku_id as \"skuId\", quantity, unit_price as \"unitPrice\", cost_price as \"costPrice\"
                from order_items where tenant_id=:tenant and order_id=:id order by sku_id
                """, Map.of("tenant", user.tenantId(), "id", orderId)));
        return order;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> report(CurrentUser user, Instant from, Instant to, UUID branchId, String channel, UUID skuId) {
        if (from != null && to != null && !from.isBefore(to)) throw BusinessException.badRequest("from must be earlier than to");
        MapSqlParameterSource p = new MapSqlParameterSource("tenant", user.tenantId());
        StringBuilder where = new StringBuilder("o.tenant_id=:tenant and o.status='COMPLETED'");
        if (from != null) { where.append(" and o.created_at>=:from"); p.addValue("from", Timestamp.from(from)); }
        if (to != null) { where.append(" and o.created_at<:to"); p.addValue("to", Timestamp.from(to)); }
        if (branchId != null) { where.append(" and o.branch_id=:branch"); p.addValue("branch", branchId); }
        if (channel != null && !channel.isBlank()) { where.append(" and o.channel=:channel"); p.addValue("channel", normalizeChannel(channel)); }
        String selectedLine = "true";
        if (skuId != null) {
            where.append(" and exists (select 1 from order_items filter_item where filter_item.tenant_id=o.tenant_id and filter_item.order_id=o.id and filter_item.sku_id=:sku)");
            p.addValue("sku", skuId);
            selectedLine = "oi.sku_id=:sku";
        }
        String reportSql = """
                with order_lines_total as (
                    select tenant_id,order_id,sum(subtotal) as gross_items
                    from order_items where tenant_id=:tenant group by tenant_id,order_id
                )
                select count(distinct o.id) as \"totalOrders\",
                       coalesce(sum(case when %s then
                           case when lt.gross_items=0 then 0 else oi.subtotal*o.total_amount/lt.gross_items end
                           else 0 end),0) as \"netRevenue\",
                       coalesce(sum(case when %s then oi.quantity*coalesce(oi.cost_price,0) else 0 end),0) as \"totalCogs\",
                       coalesce(sum(case when %s then
                           case when lt.gross_items=0 then 0 else oi.subtotal*o.total_amount/lt.gross_items end
                           - oi.quantity*coalesce(oi.cost_price,0) else 0 end),0) as \"grossProfit\"
                from orders o
                join order_items oi on oi.order_id=o.id and oi.tenant_id=o.tenant_id
                join order_lines_total lt on lt.order_id=o.id and lt.tenant_id=o.tenant_id
                where %s
                """.formatted(selectedLine, selectedLine, selectedLine, where);
        Map<String, Object> totals = jdbc.queryForMap(reportSql, p);
        totals.put("grossMargin", margin(totals));
        return totals;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> lowStock(CurrentUser user, UUID branchId) {
        MapSqlParameterSource p = new MapSqlParameterSource("tenant", user.tenantId());
        String sql = """
                select s.branch_id as \"branchId\", s.sku_id as \"skuId\", v.sku_code as sku,
                       s.on_hand as \"onHand\", s.reserved, s.on_hand-s.reserved as available,
                       v.reorder_threshold as \"reorderThreshold\"
                from stock_balances s join product_variants v on v.id=s.sku_id and v.tenant_id=s.tenant_id
                where s.tenant_id=:tenant and s.on_hand-s.reserved<=v.reorder_threshold
                """;
        if (branchId != null) { sql += " and s.branch_id=:branch"; p.addValue("branch", branchId); }
        return jdbc.queryForList(sql + " order by available asc", p);
    }

    @Scheduled(fixedDelayString = "${oism.jobs.expiry-delay-ms:60000}")
    @Transactional
    public void expireReservations() {
        List<Map<String, Object>> expired = jdbc.queryForList("""
                select tenant_id as \"tenantId\", id from orders
                where status='RESERVED' and reserved_expires_at<=now()
                order by reserved_expires_at limit 100 for update skip locked
                """, Map.of());
        for (Map<String, Object> row : expired) {
            UUID tenantId = (UUID) row.get("tenantId");
            UUID id = (UUID) row.get("id");
            Map<String, Object> lock = jdbc.queryForMap("select status from orders where tenant_id=:tenant and id=:id for update", Map.of("tenant", tenantId, "id", id));
            if ("RESERVED".equals(lock.get("status"))) {
                CurrentUser system = new CurrentUser(tenantId, null, "OWNER");
                cancel(system, id, OrderStatus.RESERVED);
                events.publishAfterCommit(tenantId, "ORDER_EXPIRED", Map.of("orderId", id));
            }
        }
    }

    private Map<String, Object> createReserved(CurrentUser user, UUID branchId, String channel, String externalId,
                                               String customerName, String customerPhone, BigDecimal discount,
                                               List<OrderRequests.Line> requestedItems) {
        assertBranch(user.tenantId(), branchId);
        Map<UUID, BigDecimal> items = aggregateItems(requestedItems);
        if (items.isEmpty()) throw BusinessException.badRequest("At least one order item is required");
        BigDecimal subtotal = BigDecimal.ZERO;
        List<LinePrice> lines = new ArrayList<>();
        for (var item : items.entrySet()) {
            Map<String, Object> variant = queryVariant(user.tenantId(), item.getKey());
            BigDecimal unitPrice = (BigDecimal) variant.get("retail_price");
            subtotal = subtotal.add(unitPrice.multiply(item.getValue()).setScale(2, RoundingMode.HALF_UP));
            lines.add(new LinePrice(item.getKey(), item.getValue(), unitPrice));
        }
        subtotal = subtotal.setScale(2, RoundingMode.HALF_UP);
        BigDecimal safeDiscount = discount == null ? BigDecimal.ZERO : discount;
        if (safeDiscount.signum() < 0 || safeDiscount.compareTo(subtotal) > 0) throw BusinessException.badRequest("discount must be between zero and subtotal");
        BigDecimal total = subtotal.subtract(safeDiscount).setScale(2, RoundingMode.HALF_UP);
        UUID id = UUID.randomUUID();
        String code = "O-" + id.toString().substring(0, 12).toUpperCase();
        jdbc.update("""
                insert into orders (id,tenant_id,branch_id,order_code,channel,external_order_id,status,customer_name,
                                    customer_phone,total_amount,reserved_expires_at,created_by)
                values (:id,:tenant,:branch,:code,:channel,:external,'DRAFT',:name,:phone,:total,:expires,:user)
                """, new MapSqlParameterSource().addValue("id", id).addValue("tenant", user.tenantId()).addValue("branch", branchId)
                .addValue("code", code).addValue("channel", channel).addValue("external", externalId)
                .addValue("name", customerName == null || customerName.isBlank() ? "Walk-in" : customerName)
                .addValue("phone", customerPhone).addValue("total", total)
                .addValue("expires", Timestamp.from(Instant.now().plusSeconds(reservationMinutes * 60L))).addValue("user", user.userId()));
        addHistory(user.tenantId(), id, null, OrderStatus.DRAFT, user.userId());
        for (LinePrice line : lines) {
            jdbc.update("""
                    insert into order_items (tenant_id,order_id,sku_id,quantity,unit_price)
                    values (:tenant,:order,:sku,:quantity,:price)
                    """, Map.of("tenant", user.tenantId(), "order", id, "sku", line.skuId(), "quantity", line.quantity(), "price", line.unitPrice()));
        }
        reserve(user, id);
        events.publishAfterCommit(user.tenantId(), "NEW_ORDER", Map.of("orderId", id, "orderCode", code, "channel", channel, "status", "RESERVED"));
        return getOrder(user, id);
    }

    private void reserve(CurrentUser user, UUID orderId) {
        Map<String, Object> order = jdbc.queryForMap("select branch_id as \"branchId\" from orders where tenant_id=:tenant and id=:id", Map.of("tenant", user.tenantId(), "id", orderId));
        UUID branchId = (UUID) order.get("branchId");
        List<StockRow> rows = orderLines(user.tenantId(), orderId).stream().map(line -> lockStock(user.tenantId(), branchId, line.skuId())).toList();
        List<OrderLine> lines = orderLines(user.tenantId(), orderId);
        for (int i = 0; i < lines.size(); i++) {
            if (rows.get(i).onHand().subtract(rows.get(i).reserved()).compareTo(lines.get(i).quantity()) < 0)
                throw BusinessException.conflict("Insufficient available stock for SKU " + lines.get(i).skuId());
        }
        for (int i = 0; i < lines.size(); i++) {
            StockRow stock = rows.get(i); OrderLine line = lines.get(i);
            jdbc.update("update stock_balances set reserved=reserved+:qty,updated_at=now() where tenant_id=:tenant and id=:id",
                    Map.of("qty", line.quantity(), "tenant", user.tenantId(), "id", stock.id()));
        }
        changeStatus(user, orderId, OrderStatus.RESERVED);
    }

    private void confirm(CurrentUser user, UUID orderId) {
        Map<String, Object> order = jdbc.queryForMap("select branch_id as \"branchId\",status from orders where tenant_id=:tenant and id=:id for update", Map.of("tenant", user.tenantId(), "id", orderId));
        if (!"RESERVED".equals(order.get("status"))) throw BusinessException.conflict("Only a reserved order can be confirmed");
        UUID branchId = (UUID) order.get("branchId");
        List<OrderLine> lines = orderLines(user.tenantId(), orderId);
        List<StockRow> rows = lines.stream().map(line -> lockStock(user.tenantId(), branchId, line.skuId())).toList();
        for (int i = 0; i < lines.size(); i++) {
            if (rows.get(i).onHand().compareTo(lines.get(i).quantity()) < 0 || rows.get(i).reserved().compareTo(lines.get(i).quantity()) < 0)
                throw BusinessException.conflict("Reserved stock is no longer available for SKU " + lines.get(i).skuId());
        }
        for (int i = 0; i < lines.size(); i++) {
            OrderLine line = lines.get(i); StockRow stock = rows.get(i);
            BigDecimal balance = stock.onHand().subtract(line.quantity());
            jdbc.update("""
                    update stock_balances set on_hand=:onHand,reserved=reserved-:qty,updated_at=now()
                    where tenant_id=:tenant and id=:id
                    """, Map.of("onHand", balance, "qty", line.quantity(), "tenant", user.tenantId(), "id", stock.id()));
            jdbc.update("""
                    insert into inventory_transactions (tenant_id,branch_id,sku_id,type,reference_type,reference_id,quantity,balance_after,unit_cost,created_by)
                    values (:tenant,:branch,:sku,'OUT','SALE',:order,:qty,:balance,:cost,:user)
                    """, new MapSqlParameterSource().addValue("tenant", user.tenantId()).addValue("branch", branchId)
                    .addValue("sku", line.skuId()).addValue("order", orderId).addValue("qty", line.quantity())
                    .addValue("balance", balance).addValue("cost", stock.averageCost()).addValue("user", user.userId()));
            jdbc.update("update order_items set cost_price=:cost where tenant_id=:tenant and order_id=:order and sku_id=:sku",
                    Map.of("cost", stock.averageCost(), "tenant", user.tenantId(), "order", orderId, "sku", line.skuId()));
        }
        changeStatus(user, orderId, OrderStatus.CONFIRMED);
        jdbc.update("update orders set confirmed_at=now() where tenant_id=:tenant and id=:id", Map.of("tenant", user.tenantId(), "id", orderId));
    }

    private void cancel(CurrentUser user, UUID orderId, OrderStatus current) {
        if (current == OrderStatus.RESERVED) {
            UUID branch = jdbc.queryForObject("select branch_id from orders where tenant_id=:tenant and id=:id", Map.of("tenant", user.tenantId(), "id", orderId), UUID.class);
            List<OrderLine> lines = orderLines(user.tenantId(), orderId);
            List<StockRow> stocks = lines.stream().map(line -> lockStock(user.tenantId(), branch, line.skuId())).toList();
            for (int i = 0; i < lines.size(); i++) {
                if (stocks.get(i).reserved().compareTo(lines.get(i).quantity()) < 0)
                    throw BusinessException.conflict("Reservation balance is inconsistent for SKU " + lines.get(i).skuId());
                jdbc.update("update stock_balances set reserved=reserved-:qty,updated_at=now() where tenant_id=:tenant and id=:id",
                        Map.of("qty", lines.get(i).quantity(), "tenant", user.tenantId(), "id", stocks.get(i).id()));
            }
        } else if (current == OrderStatus.CONFIRMED) {
            UUID branch = jdbc.queryForObject("select branch_id from orders where tenant_id=:tenant and id=:id", Map.of("tenant", user.tenantId(), "id", orderId), UUID.class);
            List<OrderLine> lines = orderLines(user.tenantId(), orderId);
            for (OrderLine line : lines) {
                StockRow stock = lockStock(user.tenantId(), branch, line.skuId());
                BigDecimal balance = stock.onHand().add(line.quantity());
                jdbc.update("update stock_balances set on_hand=:balance,updated_at=now() where tenant_id=:tenant and id=:id",
                        Map.of("balance", balance, "tenant", user.tenantId(), "id", stock.id()));
                jdbc.update("""
                        insert into inventory_transactions (tenant_id,branch_id,sku_id,type,reference_type,reference_id,quantity,balance_after,unit_cost,created_by)
                        values (:tenant,:branch,:sku,'IN','RETURN',:order,:qty,:balance,:cost,:user)
                        """, new MapSqlParameterSource().addValue("tenant", user.tenantId()).addValue("branch", branch)
                        .addValue("sku", line.skuId()).addValue("order", orderId).addValue("qty", line.quantity())
                        .addValue("balance", balance).addValue("cost", line.costPrice()).addValue("user", user.userId()));
            }
            jdbc.update("update payments set status='FAILED' where tenant_id=:tenant and order_id=:id and status='PAID'",
                    Map.of("tenant", user.tenantId(), "id", orderId));
        }
        changeStatus(user, orderId, OrderStatus.CANCELLED);
    }

    private void changeStatus(CurrentUser user, UUID orderId, OrderStatus next) {
        OrderStatus current = lockOrderStatus(user, orderId);
        current.requireTransitionTo(next);
        jdbc.update("update orders set status=:next,updated_at=now() where tenant_id=:tenant and id=:id",
                Map.of("next", next.name(), "tenant", user.tenantId(), "id", orderId));
        addHistory(user.tenantId(), orderId, current, next, user.userId());
    }

    private OrderStatus lockOrderStatus(CurrentUser user, UUID orderId) {
        String status;
        try { status = jdbc.queryForObject("select status from orders where tenant_id=:tenant and id=:id for update", Map.of("tenant", user.tenantId(), "id", orderId), String.class); }
        catch (org.springframework.dao.EmptyResultDataAccessException ex) { throw BusinessException.notFound("Order not found"); }
        return OrderStatus.valueOf(status);
    }

    private StockRow lockStock(UUID tenantId, UUID branchId, UUID skuId) {
        List<StockRow> rows = jdbc.query("""
                select s.id,s.on_hand,s.reserved,v.current_average_cost
                from stock_balances s join product_variants v on v.id=s.sku_id and v.tenant_id=s.tenant_id
                where s.tenant_id=:tenant and s.branch_id=:branch and s.sku_id=:sku and v.is_active=true
                for update of s
                """, Map.of("tenant", tenantId, "branch", branchId, "sku", skuId),
                (rs, n) -> new StockRow(rs.getLong("id"), rs.getBigDecimal("on_hand"), rs.getBigDecimal("reserved"), rs.getBigDecimal("current_average_cost")));
        if (rows.isEmpty()) throw BusinessException.conflict("No active stock row for SKU " + skuId + " at this branch");
        return rows.getFirst();
    }

    private List<OrderLine> orderLines(UUID tenantId, UUID orderId) {
        return jdbc.query("""
                select sku_id,quantity,unit_price,cost_price from order_items
                where tenant_id=:tenant and order_id=:order order by sku_id
                """, Map.of("tenant", tenantId, "order", orderId),
                (rs, n) -> new OrderLine(rs.getObject("sku_id", UUID.class), rs.getBigDecimal("quantity"), rs.getBigDecimal("unit_price"), rs.getBigDecimal("cost_price")));
    }

    private Map<String, Object> queryVariant(UUID tenantId, UUID skuId) {
        List<Map<String, Object>> rows = jdbc.queryForList("select id,retail_price,current_average_cost from product_variants where tenant_id=:tenant and id=:sku and is_active=true",
                Map.of("tenant", tenantId, "sku", skuId));
        if (rows.isEmpty()) throw BusinessException.notFound("Active SKU not found: " + skuId);
        return rows.getFirst();
    }

    private void assertBranch(UUID tenantId, UUID branchId) {
        Integer count = jdbc.queryForObject("select count(*) from branches where tenant_id=:tenant and id=:branch and is_active=true",
                Map.of("tenant", tenantId, "branch", branchId), Integer.class);
        if (count == null || count == 0) throw BusinessException.notFound("Active branch not found");
    }

    private void addHistory(UUID tenant, UUID order, OrderStatus from, OrderStatus to, UUID user) {
        jdbc.update("""
                insert into order_status_history (tenant_id,order_id,from_status,to_status,changed_by)
                values (:tenant,:order,:from,:to,:user)
                """, new MapSqlParameterSource().addValue("tenant", tenant).addValue("order", order)
                .addValue("from", from == null ? null : from.name()).addValue("to", to.name()).addValue("user", user));
    }

    private static Map<UUID, BigDecimal> aggregateItems(List<OrderRequests.Line> lines) {
        Map<UUID, BigDecimal> grouped = new java.util.TreeMap<>(Comparator.comparing(UUID::toString));
        for (var line : lines) grouped.merge(line.skuId(), line.quantity(), BigDecimal::add);
        return grouped;
    }

    private static String normalizeChannel(String channel) {
        if (channel == null) throw BusinessException.badRequest("channel is required");
        String normalized = channel.trim().toUpperCase();
        if (!CHANNELS.contains(normalized)) throw BusinessException.badRequest("channel must be POS, ADMIN, SHOPEE, TIKTOK, or LAZADA");
        return normalized;
    }

    private static BigDecimal margin(Map<String, Object> totals) {
        BigDecimal revenue = (BigDecimal) totals.get("netRevenue");
        BigDecimal profit = (BigDecimal) totals.get("grossProfit");
        return revenue == null || revenue.signum() == 0 ? BigDecimal.ZERO : profit.multiply(BigDecimal.valueOf(100)).divide(revenue, 2, RoundingMode.HALF_UP);
    }

    private record LinePrice(UUID skuId, BigDecimal quantity, BigDecimal unitPrice) {}
    private record OrderLine(UUID skuId, BigDecimal quantity, BigDecimal unitPrice, BigDecimal costPrice) {}
    private record StockRow(long id, BigDecimal onHand, BigDecimal reserved, BigDecimal averageCost) {}
}
