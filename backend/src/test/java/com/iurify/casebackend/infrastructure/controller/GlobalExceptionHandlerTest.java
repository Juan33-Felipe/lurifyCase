package com.iurify.casebackend.infrastructure.controller;

import com.iurify.casebackend.infrastructure.controller.dto.ErrorDto;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler(null);

    @Test
    void unexpectedErrorsDoNotLeakInternalDetailsToTheClient() {
        RuntimeException internal = new RuntimeException(
                "Row was updated or deleted by another transaction: "
                        + "[com.iurify.casebackend.infrastructure.persistence.entity.UserEntity#89da1bec]");

        ResponseEntity<ErrorDto> response = handler.handleGenericException(internal);
        ErrorDto body = response.getBody();

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(body);
        assertEquals("An unexpected error occurred.", body.getMessage());
        assertEquals("An unexpected error occurred.", body.getDetail());
        assertFalse(body.getMessage().contains("UserEntity"));
        assertNotNull(body.getTraceId(), "el traceId permite buscar el detalle en los logs");
    }
}
