package com.oism.inventory;

import com.oism.auth.AuthUser;
import com.oism.common.PageDto;
import com.oism.inventory.InventoryDtos.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/stock-transfers")
@PreAuthorize("hasAnyRole('OWNER','STAFF')")
@RequiredArgsConstructor
public class StockTransferController {
    private final StockTransferService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TransferDto create(@Valid @RequestBody TransferRequest r, @AuthenticationPrincipal AuthUser u) {
        return service.create(r, u.userId());
    }

    @GetMapping
    public PageDto<TransferDto> list(@RequestParam(defaultValue = "0") int page,
                                     @RequestParam(defaultValue = "20") int size) {
        return service.list(page, size);
    }

    @GetMapping("/{id}")
    public TransferDto get(@PathVariable UUID id) { return service.get(id); }

    @PostMapping("/{id}/ship")
    public TransferDto ship(@PathVariable UUID id, @AuthenticationPrincipal AuthUser u) {
        return service.ship(id, u.userId());
    }

    @PostMapping("/{id}/receive")
    public TransferDto receive(@PathVariable UUID id, @AuthenticationPrincipal AuthUser u) {
        return service.receive(id, u.userId());
    }

    @PostMapping("/{id}/cancel")
    public TransferDto cancel(@PathVariable UUID id) { return service.cancel(id); }
}
