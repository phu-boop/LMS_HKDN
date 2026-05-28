package com.lms.platform.modules.identity.service;

import com.lms.platform.common.exception.ErrorCode;
import com.lms.platform.common.exception.LoginException;
import com.lms.platform.common.exception.RefreshTokenException;
import com.lms.platform.common.model.enums.CommonStatus;
import com.lms.platform.common.security.CustomUserDetails;
import com.lms.platform.common.security.jwt.JwtProvider;
import com.lms.platform.modules.identity.dto.*;
import com.lms.platform.modules.rbac.entity.UserTenantRoleAssignment;
import com.lms.platform.modules.rbac.repository.UserTenantRoleAssignmentRepository;
import com.lms.platform.modules.tenant.entity.Tenant;
import com.lms.platform.modules.tenant.repository.TenantRepository;
import com.lms.platform.modules.user.entity.UserAccount;
import com.lms.platform.modules.user.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class IdentityServiceImpl implements IdentityService {

    @Value("${app.domain-prefix:}")
    private String domainPrefix;

    private final UserAccountRepository userAccountRepository;
    private final UserTenantRoleAssignmentRepository userTenantRoleAssignmentRepository;
    private final TenantRepository tenantRepository;
    private final JwtProvider jwtProvider;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Override
    public IdentifyResponse identify(IdentifyRequest request) {
        UserAccount userAccount = userAccountRepository
                .findByUsername(request.getIdentifier())
                .orElseThrow(this::invalidCredentials);

        // Check if account is permanently blocked or inactive
        if (userAccount.getStatus() != CommonStatus.ACTIVE) {
            throw new LoginException(HttpStatus.FORBIDDEN, ErrorCode.ACCOUNT_LOCKED);
        }

        // Check if account is temporarily locked
        if (userAccount.getLockedUntil() != null && userAccount.getLockedUntil().isAfter(OffsetDateTime.now())) {
            long secondsLeft = Duration.between(OffsetDateTime.now(), userAccount.getLockedUntil()).getSeconds();
            throw new LoginException(HttpStatus.FORBIDDEN, ErrorCode.TEMPORARILY_LOCKED, (int) secondsLeft);
        }

        Tenant tenantPrimary = getPrimaryTenant(userAccount);
        if (tenantPrimary == null) {
            throw new LoginException(HttpStatus.FORBIDDEN, ErrorCode.TENANT_NOT_ASSIGNED);
        }
        IdentityTenantBranding branding = null;
        if (tenantPrimary != null) {
            branding = buildTenantBranding(tenantPrimary);
        }

        return new IdentifyResponse("PASSWORD", branding);
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        UserAccount userAccount = userAccountRepository
                .findByUsername(request.username())
                .orElseThrow(this::invalidCredentials);

        // Check if account is permanently blocked or inactive
        // Check if account is permanently blocked or inactive
        if (userAccount.getStatus() != CommonStatus.ACTIVE) {
            throw new LoginException(HttpStatus.FORBIDDEN, ErrorCode.ACCOUNT_LOCKED);
        }

        // Check if account is temporarily locked
        if (userAccount.getLockedUntil() != null && userAccount.getLockedUntil().isAfter(OffsetDateTime.now())) {
            long secondsLeft = Duration.between(OffsetDateTime.now(), userAccount.getLockedUntil()).getSeconds();
            throw new LoginException(HttpStatus.FORBIDDEN, ErrorCode.TEMPORARILY_LOCKED, (int) secondsLeft);
        }

        try {
            validatePassword(request.password(), userAccount);
        } catch (LoginException e) {
            // Increment failed attempts
            userAccount.setFailedAttempts(userAccount.getFailedAttempts() + 1);
            if (userAccount.getFailedAttempts() >= 5) {
                userAccount.setLockedUntil(OffsetDateTime.now().plusMinutes(15));
            }
            userAccountRepository.save(userAccount);
            throw e;
        }

        // Reset failed attempts on success
        userAccount.setFailedAttempts(0);
        userAccount.setLockedUntil(null);
        userAccount.setLastLoginAt(OffsetDateTime.now());
        userAccountRepository.save(userAccount);

        Tenant tenantPrimary = getPrimaryTenant(userAccount);
        if (tenantPrimary == null) {
            throw new LoginException(HttpStatus.FORBIDDEN, ErrorCode.TENANT_NOT_ASSIGNED);
        }
        IdentityTenantBranding branding = buildTenantBranding(tenantPrimary);

        UserDetails userDetails = new CustomUserDetails(userAccount);
        String accessToken = jwtProvider.generateAccessToken(
                userAccount.getId(),
                userAccount.getHomeSchool() != null ? userAccount.getHomeSchool().toString() : null,
                userDetails,
                tenantPrimary
        );

        String refreshToken = jwtProvider.generateRefreshToken(
                userAccount.getId(),
                tenantPrimary != null ? tenantPrimary.getId() : null
        );

        return new LoginResponse(
                accessToken,
                refreshToken,
                jwtProvider.getExpiresIn(),
                branding
        );
    }

    private void validatePassword(String rawPassword, UserAccount userAccount) {
        if (!passwordEncoder.matches(rawPassword, userAccount.getPasswordHash())) {
            throw invalidCredentials();
        }
    }

    private LoginException invalidCredentials() {
        return new LoginException(ErrorCode.INVALID_CREDENTIALS);
    }

    private Tenant getPrimaryTenant(UserAccount userAccount) {
        String tenantCode = getFirstTenantCode(userAccount);
        if (tenantCode == null || tenantCode.isEmpty()) {
            return null;
        }
        return tenantRepository.findByCode(tenantCode).orElse(null);
    }

    private IdentityTenantBranding buildTenantBranding(Tenant tenant) {
        return new IdentityTenantBranding(
                tenant.getCode(),
                tenant.getName(),
                tenant.getSubdomain(),
                tenant.getSubdomain() + domainPrefix,
                true,
                tenant.getLogoUrl(),
                tenant.getAvatarUrl(),
                tenant.getWatermarkSettings()
        );
    }

    private String getFirstTenantCode(UserAccount userAccount) {
        List<UserTenantRoleAssignment> assignments =
                userTenantRoleAssignmentRepository.findByUser_Id(userAccount.getId());
        
        return assignments.stream()
                .map(assignment -> assignment.getTenant().getCode())
                .findFirst()
                .orElse("");
    }

    @Override
    public LoginResponse refresh(RefreshTokenRequest request){
        if(jwtProvider.validateToken(request.refreshToken())){
            UUID userId = UUID.fromString(
                    jwtProvider.getClaims(request.refreshToken()).getSubject()
            );
            UserAccount userAccount = userAccountRepository
                    .findById(userId)
                    .orElseThrow(this::invalidCredentials);

            if(userAccount.getLockedUntil()!=null){
                throw new RefreshTokenException(ErrorCode.INVALID_TOKEN);
            }
            Tenant tenantPrimary = getPrimaryTenant(userAccount);
            IdentityTenantBranding branding = null;
            if (tenantPrimary != null) {
                branding = buildTenantBranding(tenantPrimary);
            }

            UserDetails userDetails = new CustomUserDetails(userAccount);
            String accessToken = jwtProvider.generateAccessToken(
                    userAccount.getId(),
                    userAccount.getHomeSchool() != null ? userAccount.getHomeSchool().toString() : null,
                    userDetails,
                    tenantPrimary
            );

            String refreshToken = jwtProvider.generateRefreshToken(
                    userAccount.getId(),
                    tenantPrimary != null ? tenantPrimary.getId() : null
            );

            return new LoginResponse(
                    accessToken,
                    refreshToken,
                    jwtProvider.getExpiresIn(),
                    branding
            );
        }
        else {
            throw new RefreshTokenException(ErrorCode.INVALID_TOKEN);
        }
    }

    private Integer offsetDateTimeToInteger(OffsetDateTime x){
        Integer y = null;

        if (x != null) {
            long seconds = Duration.between(
                    OffsetDateTime.now(),
                    x
            ).getSeconds();

            y = (int) Math.max(seconds, 0);
        }
        return y;
    }
}
