package com.lms.platform.modules.identity.service;

import com.lms.platform.common.exception.LoginException;
import com.lms.platform.common.security.jwt.JwtProvider;
import com.lms.platform.modules.identity.dto.*;
import com.lms.platform.modules.rbac.entity.UserTenantRoleAssignment;
import com.lms.platform.modules.rbac.repository.UserTenantRoleAssignmentRepository;
import com.lms.platform.modules.tenant.entity.Tenant;
import com.lms.platform.modules.tenant.repository.TenantRepository;
import com.lms.platform.modules.user.repository.UserAccountRepository;
import com.lms.platform.modules.user.entity.UserAccount;
import com.lms.platform.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;


import java.util.List;


@Service
@RequiredArgsConstructor
public class IdentityServiceImpl implements IdentityService {
    @Value("${app.domain-prefix}")
    private String domainPrefix;
    private final UserAccountRepository userAccountRepository;
    private final UserTenantRoleAssignmentRepository userTenantRoleAssignmentRepository;
    private final TenantRepository tenantRepository;
    private final JwtProvider jwtProvider;

    @Override
    public IdentifyResult identify(IdentifyRequest request) {
        // For now, simply return the next step as PASSWORD (could be an enum later)
        return IdentifyResult.builder()
                .nextStep("PASSWORD")
                .build();
    }
    @Override
    public LoginResponse login(LoginRequest request) {

        UserAccount userAccount = userAccountRepository
                .findByUsername(request.username())
                .orElseThrow(this::invalidCredentials);

        validatePassword(request.password(), userAccount);

        Tenant tenant = getPrimaryTenant(userAccount);
        IdentityTenantBranding branding = null;
        if(tenant != null){
            branding = buildTenantBranding(tenant);
        }
        UserDetails userDetails = new CustomUserDetails(userAccount);

        String accessToken = jwtProvider.generateAccessToken(
                userDetails,
                tenant!=null?tenant.getId():null,
                tenant!=null?tenant.getCode():null
        );

        String refreshToken = jwtProvider.generateRefreshToken(
                userDetails,
                tenant!=null?tenant.getId():null
        );

        return new LoginResponse(
                accessToken,
                refreshToken,
                jwtProvider.getExpiresIn(),
                branding
        );
    }

    private void validatePassword(String rawPassword, UserAccount userAccount) {

//        if (!userAccount.getPasswordHash().equals(rawPassword)) {
//            throw invalidCredentials();
//        }
    }

    private LoginException invalidCredentials() {

        return new LoginException(
                "INVALID_CREDENTIALS",
                "Invalid username or password."
        );
    }

    private Tenant getPrimaryTenant(UserAccount userAccount) {

        String tenantCode = getCodeTenantFirst(userAccount);

        return tenantRepository.findByCode(tenantCode)
                .orElse(null);
    }

    private IdentityTenantBranding buildTenantBranding(Tenant tenant) {

        return IdentityTenantBranding.builder()
                .tenantCode(tenant.getCode())
                .name(tenant.getName())
                .subdomain(tenant.getSubdomain())
                .domain(tenant.getSubdomain() + domainPrefix)
                .isWhiteLabel(true)
                .logoUrl(tenant.getLogoUrl())
                .avatarUrl(tenant.getAvatarUrl())
                .watermarkSettings(tenant.getWatermarkSettings())
                .build();
    }
    private String getCodeTenantFirst(UserAccount UserAccount){
        List<UserTenantRoleAssignment> assignments =
                userTenantRoleAssignmentRepository.findByUser_Id(UserAccount.getId());
        String tenantString = "";
        for (UserTenantRoleAssignment assignment : assignments) {
            tenantString = assignment.getTenant().getCode();
            break;
        };
        return tenantString;
    }
}
