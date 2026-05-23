package com.lms.platform.modules.identity.controller;

import com.lms.platform.modules.identity.dto.IdentifyRequest;
import com.lms.platform.modules.identity.dto.IdentifyResult;
import com.lms.platform.modules.identity.dto.LoginRequest;
import com.lms.platform.modules.identity.dto.LoginResponse;
import com.lms.platform.modules.identity.service.IdentityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/identity")
@RequiredArgsConstructor
public class IdentityController {

    private final IdentityService identityService;

    @PostMapping("/identify")
    public ResponseEntity<IdentifyResult> identify(@Valid @RequestBody IdentifyRequest request) {
        IdentifyResult result = identityService.identify(request);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/auth/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest loginRequest){
        LoginResponse result = identityService.login(loginRequest);;
        return ResponseEntity.ok(result);
    }
}
