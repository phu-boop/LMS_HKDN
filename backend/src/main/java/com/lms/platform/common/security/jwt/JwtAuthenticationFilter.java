package com.lms.platform.common.security.jwt;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Spring Security filter that validates JWT tokens attached to incoming requests.
 * <p>
 * The filter extracts the token from the {@code Authorization} header (expects a "Bearer" scheme),
 * validates it using {@link JwtProvider}, and, if valid, builds an authentication object
 * containing the username and authorities extracted from the token claims. The authentication
 * object is then stored in the {@link SecurityContextHolder} for downstream security checks.
 * </p>
 *
 * This filter is placed after {@link com.lms.platform.common.security.tenant.TenantResolutionFilter}
 * in the filter chain (see {@link com.lms.platform.common.security.config.SecurityConfig})
 * to ensure tenant context is already resolved before authentication proceeds.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String token = resolveToken(request);
        if (token != null && jwtProvider.validateToken(token)) {
            Claims claims = jwtProvider.getClaims(token);
            String username = claims.getSubject();
            @SuppressWarnings("unchecked")
            List<?> roles = claims.get("roles", List.class);
            Collection<SimpleGrantedAuthority> authorities = (roles != null ? roles : List.of())
                    .stream()
                    .map(Object::toString)
                    .map(SimpleGrantedAuthority::new)
                    .collect(Collectors.toList());
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(username, null, authorities);
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }
        // Continue the chain regardless of authentication outcome; downstream filters may handle unauthenticated access.
        filterChain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader(AUTHORIZATION_HEADER);
        if (bearerToken != null && bearerToken.startsWith(BEARER_PREFIX)) {
            return bearerToken.substring(BEARER_PREFIX.length()).trim();
        }
        return null;
    }
}
