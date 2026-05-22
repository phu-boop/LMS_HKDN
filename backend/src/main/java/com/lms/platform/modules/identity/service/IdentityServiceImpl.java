package com.lms.platform.modules.identity.service;

import com.lms.platform.modules.identity.dto.IdentifyRequest;
import com.lms.platform.modules.identity.dto.IdentifyResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class IdentityServiceImpl implements IdentityService {

    @Override
    public IdentifyResult identify(IdentifyRequest request) {
        // For now, simply return the next step as PASSWORD (could be an enum later)
        return IdentifyResult.builder()
                .nextStep("PASSWORD")
                .build();
    }
}
