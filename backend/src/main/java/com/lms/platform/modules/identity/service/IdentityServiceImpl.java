package com.lms.platform.modules.identity.service;

import com.lms.platform.common.exception.ForbiddenException;
import com.lms.platform.common.exception.LoginException;
import com.lms.platform.common.security.jwt.JwtProvider;
import com.lms.platform.modules.identity.dto.IdentifyRequest;
import com.lms.platform.modules.identity.dto.IdentifyResult;
import com.lms.platform.modules.identity.dto.LoginRequest;
import com.lms.platform.modules.identity.dto.LoginResponse;
import com.lms.platform.modules.identity.repository.UserAccountRepository;
import com.lms.platform.modules.user.entity.UserAccount;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class IdentityServiceImpl implements IdentityService {
    private final UserAccountRepository userAccountRepository;
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
        UserAccount userAccount = userAccountRepository.findByUsername(request.username())
                .orElseThrow(() ->
                        new LoginException(
                                "INVALID_CREDENTIALS",
                                "Invalid username or password."
                        )

                );
        if(!userAccount.getPasswordHash().equals(request.password())){
            throw new LoginException(
                    "INVALID_CREDENTIALS",
                    "Invalid username or password."
            );
        }
        String accessToken = "to do";
        String refreshToken = "to do";
        return new LoginResponse(accessToken, refreshToken,jwtProvider.getExpiresIn(),null);
    }

}
