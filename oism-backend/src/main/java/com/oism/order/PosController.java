package com.oism.order;

import com.oism.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/pos")
public class PosController {
    private final OrderService orders;
    public PosController(OrderService orders) { this.orders = orders; }

    @PostMapping("/checkout")
    @PreAuthorize("hasAnyRole('OWNER','CASHIER')")
    public Map<String, Object> checkout(@AuthenticationPrincipal CurrentUser user,
                                        @Valid @RequestBody OrderRequests.Checkout request) {
        return orders.checkout(user, request);
    }
}
