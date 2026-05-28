package com.lms.platform.common.exception;

/**
 * Centralized enumeration of error codes used throughout the application.
 * Each constant holds the error code string and a default human‑readable message.
 */
public enum ErrorCode {
    ACCOUNT_LOCKED("ACCOUNT_LOCKED", "Account is locked. Please contact your administrator."),
    TEMPORARILY_LOCKED("TEMPORARILY_LOCKED", "Account is temporarily locked. Please try again later."),
    TENANT_NOT_ASSIGNED("TENANT_NOT_ASSIGNED", "User is not assigned to any active tenant."),
    INVALID_CREDENTIALS("INVALID_CREDENTIALS", "Invalid credentials provided."),
    INVALID_TOKEN("INVALID_TOKEN", "Refresh token is invalid or expired."),
    ;

    private final String code;
    private final String defaultMessage;

    ErrorCode(String code, String defaultMessage) {
        this.code = code;
        this.defaultMessage = defaultMessage;
    }

    public String getCode() {
        return code;
    }

    public String getDefaultMessage() {
        return defaultMessage;
    }
}
