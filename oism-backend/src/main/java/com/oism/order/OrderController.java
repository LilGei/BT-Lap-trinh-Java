package com.oism.order;

import com.oism.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderService orders;
    public OrderController(OrderService orders) { this.orders = orders; }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER','STAFF')")
    public List<Map<String, Object>> list(@AuthenticationPrincipal CurrentUser user,
                                          @RequestParam(required = false) UUID branchId,
                                          @RequestParam(required = false) String status,
                                          @RequestParam(defaultValue = "50") int limit) {
        return orders.list(user, branchId, status, limit);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','STAFF')")
    public Map<String, Object> get(@AuthenticationPrincipal CurrentUser user, @PathVariable UUID id) {
        return orders.getOrder(user, id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER','STAFF')")
    public Map<String, Object> create(@AuthenticationPrincipal CurrentUser user, @Valid @RequestBody OrderRequests.CreateOrder request) {
        return orders.create(user, request);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('OWNER','STAFF')")
    public Map<String, Object> transition(@AuthenticationPrincipal CurrentUser user, @PathVariable UUID id,
                                          @Valid @RequestBody OrderRequests.StatusChange request) {
        return orders.transition(user, id, request.status());
    }
}
