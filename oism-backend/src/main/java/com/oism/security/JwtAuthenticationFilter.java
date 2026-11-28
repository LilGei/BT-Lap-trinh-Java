package com.oism.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Set;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    /** Endpoint public của BE1: FE hay đính kèm access token đã hết hạn khi gọi refresh - không được trả 401 ở đây. */
    private static final Set<String> PUBLIC_POST = Set.of(
            "/api/auth/register-tenant", "/api/auth/login", "/api/auth/refresh", "/api/auth/logout");

    private final JwtTokenService tokens;
    public JwtAuthenticationFilter(JwtTokenService tokens) { this.tokens = tokens; }

    @Override protected boolean shouldNotFilter(HttpServletRequest request) {
        return "POST".equals(request.getMethod()) && PUBLIC_POST.contains(request.getRequestURI());
    }

    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            try {
                CurrentUser user = tokens.parse(header.substring(7));
                var auth = new UsernamePasswordAuthenticationToken(user, null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + user.role())));
                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (RuntimeException ex) {
                SecurityContextHolder.clearContext();
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid or expired bearer token");
                return;
            }
        }
        chain.doFilter(request, response);
    }
}
