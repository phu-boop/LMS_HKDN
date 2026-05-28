package com.lms.platform.common.security.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("LMS Platform API")
                        .description("Enterprise LMS Platform API Documentation")
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("LMS Team")
                                .email("dev@daihoc.io.vn"))
                        .license(new License()
                                .name("Internal License")));
    }
}