package com.lms.platform.modules.identity.service;

import com.lms.platform.modules.identity.dto.IdentifyRequest;
import com.lms.platform.modules.identity.dto.IdentifyResult;
import com.lms.platform.modules.identity.dto.LoginRequest;
import com.lms.platform.modules.identity.dto.LoginResponse;

public interface IdentityService {
    IdentifyResult identify(IdentifyRequest request);
    LoginResponse login(LoginRequest request);
}
