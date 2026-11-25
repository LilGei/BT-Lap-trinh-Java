package com.oism.report;

import com.oism.security.CurrentUser;
import com.oism.order.OrderService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/reports")
@PreAuthorize("hasAnyRole('OWNER','STAFF')")
public class ReportController {
    private final OrderService reports;
    public ReportController(OrderService reports) { this.reports = reports; }

    @GetMapping("/gross-profit")
    public Map<String, Object> grossProfit(@AuthenticationPrincipal CurrentUser user,
                                          @RequestParam(required = false) Instant from,
                                          @RequestParam(required = false) Instant to,
                                          @RequestParam(required = false) UUID branchId,
                                          @RequestParam(required = false) String channel,
                                          @RequestParam(required = false) UUID skuId) {
        return reports.report(user, from, to, branchId, channel, skuId);
    }

    @GetMapping("/low-stock")
    public List<Map<String, Object>> lowStock(@AuthenticationPrincipal CurrentUser user,
                                               @RequestParam(required = false) UUID branchId) {
        return reports.lowStock(user, branchId);
    }
}
