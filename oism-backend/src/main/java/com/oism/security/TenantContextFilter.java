package com.oism.security;

import com.oism.auth.AuthUser;
import com.oism.tenant.TenantContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Đưa tenantId trong JWT vào {@link TenantContext} để Hibernate {@code @TenantId} tự lọc/ghi tenant_id
 * cho các entity JPA (phần BE1/BE2). Luôn clear ở finally để không rò tenant sang request khác trên cùng thread.
 * Không khai báo @Component: filter này chỉ nằm trong Security chain (tạo trong SecurityConfig).
 */
public class TenantContextFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof AuthUser user) {
                TenantContext.set(user.tenantId());
            }
            chain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }
}
