package com.lms.platform.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Custom exception mapping to the IdentifyError response.
 */
public class IdentifyException extends BaseException {

    public IdentifyException(String code, String message) {
        super(HttpStatus.BAD_REQUEST, code, "Identify Error", message);
    }
}
