package com.lms.platform.common.security.tenant;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lms.platform.common.exception.TenantContextRequiredException;
import com.lms.platform.common.exception.TenantNotFoundException;
import com.lms.platform.common.model.enums.CommonStatus;
import com.lms.platform.common.response.ProblemDetails;
import com.lms.platform.modules.tenant.entity.Tenant;
import com.lms.platform.modules.tenant.repository.TenantRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import org.springframework.util.AntPathMatcher;

/**
 * Filter responsible for intercepting all requests and resolving the active Tenant context.
 * Resolves tenant via the 'X-Tenant-Code' header or the Host header subdomain.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TenantResolutionFilter extends OncePerRequestFilter {

    private final TenantRepository tenantRepository;
    private final ObjectMapper objectMapper;

    // List of path prefixes that bypass tenant resolution (e.g. system health endpoints, swagger docs)
    private static final List<String> EXCLUDED_PATHS = Arrays.asList(
            "/api/health/**",
            "/api/identity/**",
            "/swagger-ui",
            "/v3/api-docs",
            "/favicon.ico"
    );

    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return EXCLUDED_PATHS.stream().anyMatch(pattern -> pathMatcher.match(pattern, path));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        try {
            String tenantCode = request.getHeader("X-Tenant-Code");
            Tenant tenant = null;

            if (tenantCode != null && !tenantCode.trim().isEmpty()) {
                // 1. Resolve by custom header X-Tenant-Code (ideal for Postman/API testing)
                tenant = tenantRepository.findByCodeAndStatusAndIsDeletedFalse(tenantCode, CommonStatus.ACTIVE)
                        .orElseThrow(() -> new TenantNotFoundException("No active tenant found with code: " + tenantCode));
            } else {
                // 2. Resolve by host subdomain
                String host = request.getHeader("Host");
                if (host != null) {
                    String subdomain = getSubdomain(host);
                    if (subdomain != null && !isSystemSubdomain(subdomain)) {
                        tenant = tenantRepository.findBySubdomainAndStatusAndIsDeletedFalse(subdomain, CommonStatus.ACTIVE)
                                .orElseThrow(() -> new TenantNotFoundException("No active tenant found for subdomain: " + subdomain));
                    }
                }
            }

            if (tenant == null) {
                // No tenant resolved
                //throw new TenantContextRequiredException("Tenant context is required for this request. Please provide 'X-Tenant-Code' header or access via a tenant subdomain.");
                filterChain.doFilter(request, response);
                return;
            }

            // Bind resolved tenant metadata to current ThreadLocal context
            TenantContext context = TenantContext.builder()
                    .tenantId(tenant.getId())
                    .code(tenant.getCode())
                    .subdomain(tenant.getSubdomain())
                    .build();

            TenantContextHolder.setTenantContext(context);
            log.debug("Tenant resolved: [{}] (id: {}) for path: {}", tenant.getCode(), tenant.getId(), request.getRequestURI());

            filterChain.doFilter(request, response);

        } catch (TenantNotFoundException | TenantContextRequiredException ex) {
            log.warn("Tenant resolution failed for URI {}: {}", request.getRequestURI(), ex.getMessage());
            writeErrorResponse(response, request.getRequestURI(), ex.getStatus(), ex.getCode(), ex.getTitle(), ex.getMessage());
        } catch (Exception ex) {
            log.error("Unexpected error in TenantResolutionFilter during request: {}", request.getRequestURI(), ex);
            writeErrorResponse(response, request.getRequestURI(), HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR", "Internal Server Error", "An unexpected error occurred during tenant resolution.");
        } finally {
            // Crucial: always clear context to prevent memory leak and context pollution
            TenantContextHolder.clear();
        }
    }

    private String getSubdomain(String host) {
        if (host == null || host.isEmpty()) {
            return null;
        }
        // Extract host without port
        String domain = host.split(":")[0];
        String[] parts = domain.split("\\.");
        
        // Subdomain is parts[0] only if domain structure is multi-level (e.g. tenant1.lms.io.vn)
        if (parts.length >= 3) {
            return parts[0];
        }
        return null;
    }

    private boolean isSystemSubdomain(String subdomain) {
        return "www".equalsIgnoreCase(subdomain) ||
               "admin".equalsIgnoreCase(subdomain) ||
               "api".equalsIgnoreCase(subdomain) ||
               "localhost".equalsIgnoreCase(subdomain);
    }

    private void writeErrorResponse(HttpServletResponse response, String instance, HttpStatus status, String code, String title, String detail) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        
        ProblemDetails problemDetails = ProblemDetails.builder()
                .type("https://errors.daihoc.io.vn/" + code.toLowerCase().replace("_", "-"))
                .title(title)
                .status(status.value())
                .detail(detail)
                .instance(instance)
                .build();
                
        response.getWriter().write(objectMapper.writeValueAsString(problemDetails));
    }
}
