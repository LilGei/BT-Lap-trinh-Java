package com.oism.purchasing;

import com.oism.auth.AuthUser;
import com.oism.common.BusinessException;
import com.oism.common.EntityLookup;
import com.oism.common.PageDto;
import com.oism.purchasing.PurchaseDtos.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@PreAuthorize("hasAnyRole('OWNER','STAFF')")
@RequiredArgsConstructor
public class PurchaseController {
    private final PurchaseService service;
    private final SupplierRepository suppliers;

    // ----- Suppliers -----
    @GetMapping("/suppliers")
    @Transactional(readOnly = true)
    public List<SupplierDto> listSuppliers() {
        return suppliers.findAllByOrderByNameAsc().stream().map(PurchaseController::dto).toList();
    }

    @PostMapping("/suppliers")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public SupplierDto createSupplier(@Valid @RequestBody SupplierRequest r) {
        Supplier s = new Supplier();
        s.setName(r.name().trim());
        s.setPhone(r.phone());
        s.setAddress(r.address());
        return dto(suppliers.save(s));
    }

    @PutMapping("/suppliers/{id}")
    @Transactional
    public SupplierDto updateSupplier(@PathVariable UUID id, @Valid @RequestBody SupplierRequest r) {
        Supplier s = EntityLookup.require(suppliers, id, "Supplier");
        s.setName(r.name().trim());
        s.setPhone(r.phone());
        s.setAddress(r.address());
        return dto(s);
    }

    // ----- Purchase receipts -----
    @PostMapping("/purchase-receipts")
    @ResponseStatus(HttpStatus.CREATED)
    public ReceiptDto create(@Valid @RequestBody ReceiptRequest r, @AuthenticationPrincipal AuthUser user) {
        return service.create(r, user.userId());
    }

    @GetMapping("/purchase-receipts")
    public PageDto<ReceiptDto> list(@RequestParam(defaultValue = "0") int page,
                                    @RequestParam(defaultValue = "20") int size) {
        return service.list(page, size);
    }

    @GetMapping("/purchase-receipts/{id}")
    public ReceiptDto get(@PathVariable UUID id) { return service.get(id); }

    @PostMapping("/purchase-receipts/{id}/confirm")
    public ReceiptDto confirm(@PathVariable UUID id, @AuthenticationPrincipal AuthUser user) {
        return service.confirm(id, user.userId());
    }

    @PostMapping("/purchase-receipts/{id}/cancel")
    public ReceiptDto cancel(@PathVariable UUID id) { return service.cancel(id); }

    private static SupplierDto dto(Supplier s) {
        return new SupplierDto(s.getId(), s.getName(), s.getPhone(), s.getAddress(), s.isActive());
    }
}
