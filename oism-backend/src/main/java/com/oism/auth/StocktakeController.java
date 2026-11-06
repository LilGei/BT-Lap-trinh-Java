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
@RequestMapping("/api/stocktakes")
@PreAuthorize("hasAnyRole('OWNER','STAFF')")
@RequiredArgsConstructor
public class StocktakeController {
    private final StocktakeService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StocktakeDto create(@Valid @RequestBody StocktakeRequest r, @AuthenticationPrincipal AuthUser u) {
        return service.create(r, u.userId());
    }

    @GetMapping
    public PageDto<StocktakeDto> list(@RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "20") int size) {
        return service.list(page, size);
    }

    @GetMapping("/{id}")
    public StocktakeDto get(@PathVariable UUID id) { return service.get(id); }

    @PutMapping("/{id}/counts")
    public StocktakeDto counts(@PathVariable UUID id, @Valid @RequestBody CountsRequest r) {
        return service.recordCounts(id, r);
    }

    @PostMapping("/{id}/complete")
    public StocktakeDto complete(@PathVariable UUID id, @AuthenticationPrincipal AuthUser u) {
        return service.complete(id, u.userId());
    }

    /** Bỏ phiên kiểm kê đang đếm dở. */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) { service.delete(id); }
}
