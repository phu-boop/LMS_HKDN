package com.lms.platform.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Base exception for the LMS Platform. All custom domain or HTTP exceptions
 * should inherit from this class.
 */
public abstract class BaseException extends RuntimeException {
    
    private final HttpStatus status;
    private final String code;
    private final String title;

    protected BaseException(HttpStatus status, String code, String title, String detail) {
        super(detail);
        this.status = status;
        this.code = code;
        this.title = title;
    }

    protected BaseException(HttpStatus status, String code, String title, String detail, Throwable cause) {
        super(detail, cause);
        this.status = status;
        this.code = code;
        this.title = title;
    }
    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }

    public String getTitle() {
        return title;
    }

    public String getDetail() {
        return getMessage();
    }
}
