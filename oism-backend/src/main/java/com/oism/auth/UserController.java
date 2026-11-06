package com.oism.user;

import com.oism.auth.*;
import com.oism.branch.BranchRepository;
import com.oism.common.BusinessException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/** FR-AUTH-03: Owner tạo/khoá tài khoản Staff, Cashier và gán họ vào các chi nhánh ("works at"). */
@RestController
@RequestMapping("/api/users")
@PreAuthorize("hasRole('OWNER')")
@RequiredArgsConstructor
public class UserController {
    private final UserRepository users;
    private final RoleRepository roles;
    private final UserBranchRepository userBranches;
    private final BranchRepository branches;
    private final PasswordEncoder encoder;

    public record CreateUserRequest(@NotBlank String fullName, @Email String email, String phone,
                                    @NotBlank @Size(min = 8, max = 72) String password,
                                    @NotNull RoleName role, List<UUID> branchIds) {}
    public record BranchesRequest(@NotNull List<UUID> branchIds) {}
    public record UserDto(UUID id, String fullName, String email, String phone, RoleName role,
                          UserStatus status, List<UUID> branchIds) {}

    @GetMapping
    @Transactional(readOnly = true)
    public List<UserDto> list(@AuthenticationPrincipal AuthUser me) {
        List<User> list = users.findByTenantIdOrderByFullNameAsc(me.tenantId());
        Map<UUID, List<UUID>> byUser = userBranches.findByUserIdIn(list.stream().map(User::getId).toList()).stream()
                .collect(Collectors.groupingBy(UserBranch::getUserId,
                        Collectors.mapping(UserBranch::getBranchId, Collectors.toList())));
        return list.stream().map(u -> dto(u, byUser.getOrDefault(u.getId(), List.of()))).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public UserDto create(@Valid @RequestBody CreateUserRequest r, @AuthenticationPrincipal AuthUser me) {
        if (r.role() == RoleName.OWNER) throw BusinessException.badRequest("Only STAFF or CASHIER accounts can be created");
        boolean hasEmail = r.email() != null && !r.email().isBlank();
        boolean hasPhone = r.phone() != null && !r.phone().isBlank();
        if (!hasEmail && !hasPhone) throw BusinessException.badRequest("Email or phone is required");
        if (hasEmail && users.existsByEmailIgnoreCase(r.email())) throw BusinessException.conflict("Email already used");
        if (hasPhone && users.existsByPhone(r.phone())) throw BusinessException.conflict("Phone already used");
        List<UUID> branchIds = distinct(r.branchIds());
        branchIds.forEach(branches::requireActive);

        User u = new User();
        u.setTenantId(me.tenantId());
        u.setRole(roles.findByName(r.role()).orElseThrow(() -> BusinessException.notFound("Role")));
        u.setEmail(hasEmail ? r.email() : null);
        u.setPhone(hasPhone ? r.phone() : null);
        u.setFullName(r.fullName().trim());
        u.setPasswordHash(encoder.encode(r.password()));
        u = users.save(u);
        saveBranches(u.getId(), branchIds);
        return dto(u, branchIds);
    }

    /** Thay toàn bộ danh sách chi nhánh mà user làm việc. */
    @PutMapping("/{id}/branches")
    @Transactional
    public UserDto setBranches(@PathVariable UUID id, @Valid @RequestBody BranchesRequest r,
                               @AuthenticationPrincipal AuthUser me) {
        User u = own(id, me);
        List<UUID> branchIds = distinct(r.branchIds());
        branchIds.forEach(branches::requireActive);
        userBranches.deleteByUser(id);
        saveBranches(id, branchIds);
        return dto(u, branchIds);
    }

    /** ACTIVE / LOCKED / INACTIVE. User không bị khoá thì mới đăng nhập được. */
    @PatchMapping("/{id}/status")
    @Transactional
    public UserDto setStatus(@PathVariable UUID id, @RequestParam UserStatus value, @AuthenticationPrincipal AuthUser me) {
        User u = own(id, me);
        if (u.getId().equals(me.userId()) && value != UserStatus.ACTIVE)
            throw BusinessException.badRequest("You cannot lock or deactivate yourself");
        u.setStatus(value);
        return dto(u, userBranches.findByUserId(id).stream().map(UserBranch::getBranchId).toList());
    }

    private User own(UUID id, AuthUser me) {
        return users.findById(id).filter(x -> x.getTenantId().equals(me.tenantId()))
                .orElseThrow(() -> BusinessException.notFound("User"));
    }

    private void saveBranches(UUID userId, List<UUID> branchIds) {
        for (UUID b : branchIds) {
            UserBranch ub = new UserBranch();
            ub.setUserId(userId);
            ub.setBranchId(b);
            userBranches.save(ub);
        }
    }

    private static List<UUID> distinct(List<UUID> ids) {
        return ids == null ? List.of() : new ArrayList<>(new LinkedHashSet<>(ids));
    }

    private static UserDto dto(User u, List<UUID> branchIds) {
        return new UserDto(u.getId(), u.getFullName(), u.getEmail(), u.getPhone(), u.getRole().getName(),
                u.getStatus(), branchIds);
    }
}
