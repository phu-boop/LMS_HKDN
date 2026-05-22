package com.lms.platform.modules.identity.service;

import com.lms.platform.modules.identity.dto.IdentifyRequest;
import com.lms.platform.modules.identity.dto.IdentifyResult;

public interface IdentityService {
    IdentifyResult identify(IdentifyRequest request);
}
