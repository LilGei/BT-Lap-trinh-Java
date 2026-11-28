package com.oism.auth;

import com.oism.auth.AuthDtos.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** FR-AUTH-01/02. 4 endpoint POST đầu là public (khai báo trong SecurityConfig); /me cần Bearer token. */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService service;

    @PostMapping("/register-tenant")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse registerTenant(@Valid @RequestBody RegisterTenantRequest req) { return service.registerTenant(req); }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) { return service.login(req); }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest req) { return service.refresh(req.refreshToken()); }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@Valid @RequestBody RefreshRequest req) { service.logout(req.refreshToken()); }

    @GetMapping("/me")
    public MeResponse me(@AuthenticationPrincipal AuthUser me) { return service.me(me); }
}
