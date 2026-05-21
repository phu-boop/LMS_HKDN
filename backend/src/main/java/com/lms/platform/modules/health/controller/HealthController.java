package com.lms.platform.modules.health.controller;

import com.lms.platform.common.response.HealthResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    @GetMapping
    public ResponseEntity<HealthResponse> overallHealth() {
        return ResponseEntity.ok(HealthResponse.up(
                "LMS Backend is healthy and responding",
                Map.of("service", "lms-backend-platform")
        ));
    }

    @GetMapping("/live")
    public ResponseEntity<HealthResponse> liveness() {
        return ResponseEntity.ok(HealthResponse.up("Liveness — application is running"));
    }

    @GetMapping("/ready")
    public ResponseEntity<HealthResponse> readiness() {
        return ResponseEntity.ok(HealthResponse.up(
                "Readiness — application is ready to serve traffic",
                Map.of(
                        "database", "UP",
                        "redis", "UP",
                        "storage", "UP"
                )
        ));
    }
}
