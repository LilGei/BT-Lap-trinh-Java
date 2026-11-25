package com.oism.order;

import com.oism.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/webhooks")
public class WebhookController {
    private final OrderService orders;
    public WebhookController(OrderService orders) { this.orders = orders; }

    @PostMapping("/{channel}/orders")
    @PreAuthorize("hasAnyRole('OWNER','STAFF')")
    public Map<String, Object> ingest(@AuthenticationPrincipal CurrentUser user, @PathVariable String channel,
                                      @Valid @RequestBody OrderRequests.WebhookOrder request) {
        return orders.webhook(user, channel, request);
    }
}
