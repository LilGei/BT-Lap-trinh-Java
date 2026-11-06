package com.oism.branch;

import com.oism.common.BusinessException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/** FR-AUTH-04. Tenant isolation do Hibernate @TenantId đảm bảo - không cần where tenant_id thủ công. */
@RestController
@RequestMapping("/api/branches")
@RequiredArgsConstructor
public class BranchController {
    private final BranchRepository repo;

    public record BranchRequest(@NotBlank String code, @NotBlank String name, String address, BranchType type) {}

    @GetMapping
    @Transactional(readOnly = true)
    public List<Branch> list() { return repo.findAll(); }

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Branch create(@Valid @RequestBody BranchRequest r) {
        if (repo.existsByCodeIgnoreCase(r.code()))
            throw new BusinessException(HttpStatus.CONFLICT, "Branch code already exists");
        Branch b = new Branch();
        b.setCode(r.code()); b.setName(r.name()); b.setAddress(r.address());
        b.setType(r.type() == null ? BranchType.STORE : r.type());
        return repo.save(b);
    }

    @PatchMapping("/{id}/active")
    @PreAuthorize("hasRole('OWNER')")
    @Transactional
    public Branch toggle(@PathVariable UUID id, @RequestParam boolean value) {
        Branch b = repo.findById(id).orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Branch not found"));
        b.setActive(value);
        return b;
    }
}
