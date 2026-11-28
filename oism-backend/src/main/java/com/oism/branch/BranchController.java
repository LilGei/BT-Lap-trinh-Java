package com.oism.branch;

import com.oism.common.BusinessException;
import com.oism.common.EntityLookup;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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

    public record BranchRequest(@NotBlank @Size(max = 50) String code, @NotBlank @Size(max = 200) String name,
                                @Size(max = 500) String address, BranchType type) {}

    @GetMapping
    @Transactional(readOnly = true)
    public List<Branch> list() { return repo.findAll(); }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public Branch get(@PathVariable UUID id) { return EntityLookup.require(repo, id, "Branch"); }

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Branch create(@Valid @RequestBody BranchRequest r) {
        String code = r.code().trim();
        if (repo.existsByCodeIgnoreCase(code))
            throw new BusinessException(HttpStatus.CONFLICT, "Branch code already exists");
        Branch b = new Branch();
        b.setCode(code); b.setName(r.name().trim()); b.setAddress(r.address());
        b.setType(r.type() == null ? BranchType.STORE : r.type());
        return repo.save(b);
    }

    /** FR-PROD: sửa thông tin chi nhánh (Owner). Đổi mã thì không được trùng chi nhánh khác. */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    @Transactional
    public Branch update(@PathVariable UUID id, @Valid @RequestBody BranchRequest r) {
        Branch b = EntityLookup.require(repo, id, "Branch");
        String code = r.code().trim();
        if (!b.getCode().equalsIgnoreCase(code) && repo.existsByCodeIgnoreCase(code))
            throw new BusinessException(HttpStatus.CONFLICT, "Branch code already exists");
        b.setCode(code); b.setName(r.name().trim()); b.setAddress(r.address());
        if (r.type() != null) b.setType(r.type());
        return b;
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
