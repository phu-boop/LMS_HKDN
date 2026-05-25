package com.lms.platform.modules.identity.service;

import com.lms.platform.modules.identity.dto.*;

public interface IdentityService {
    IdentifyResponse identify(IdentifyRequest request);
    LoginResponse login(LoginRequest request);
    LoginResponse refresh(RefreshTokenRequest request);
}
