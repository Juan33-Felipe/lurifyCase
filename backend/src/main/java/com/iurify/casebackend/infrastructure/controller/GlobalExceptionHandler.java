package com.iurify.casebackend.infrastructure.controller;

import com.iurify.casebackend.application.exception.AuthenticationFailedException;
import com.iurify.casebackend.application.exception.CanvasVersionConflictException;
import com.iurify.casebackend.application.exception.DocumentConflictException;
import com.iurify.casebackend.application.exception.ResourceNotFoundException;
import com.iurify.casebackend.application.exception.UnprocessableEntityException;
import com.iurify.casebackend.infrastructure.controller.dto.CanvasConflictErrorDto;
import com.iurify.casebackend.infrastructure.controller.dto.CanvasSnapshotDto;
import com.iurify.casebackend.infrastructure.controller.dto.ErrorDto;
import com.iurify.casebackend.infrastructure.controller.mapper.DtoMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.UUID;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private final DtoMapper dtoMapper;

    public GlobalExceptionHandler(DtoMapper dtoMapper) {
        this.dtoMapper = dtoMapper;
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorDto> handleResourceNotFoundException(ResourceNotFoundException ex) {
        ErrorDto error = new ErrorDto(
                "https://api.iurify.com/errors/not-found",
                "Resource Not Found",
                HttpStatus.NOT_FOUND.value(),
                ex.getMessage(),
                "RESOURCE_NOT_FOUND",
                ex.getMessage(),
                generateTraceId(),
                false
        );
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(AuthenticationFailedException.class)
    public ResponseEntity<ErrorDto> handleAuthenticationFailedException(AuthenticationFailedException ex) {
        ErrorDto error = new ErrorDto(
                "https://api.iurify.com/errors/unauthorized",
                "Authentication Failed",
                HttpStatus.UNAUTHORIZED.value(),
                ex.getMessage(),
                "INVALID_CREDENTIALS",
                ex.getMessage(),
                generateTraceId(),
                false
        );
        return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(CanvasVersionConflictException.class)
    public ResponseEntity<CanvasConflictErrorDto> handleCanvasVersionConflictException(CanvasVersionConflictException ex) {
        CanvasSnapshotDto snapshotDto = dtoMapper.toCanvasSnapshotDto(ex.getLatestCanvasVersion());
        CanvasConflictErrorDto conflictError = new CanvasConflictErrorDto(
                "CANVAS_VERSION_CONFLICT",
                ex.getMessage(),
                generateTraceId(),
                true,
                ex.getCurrentVersion(),
                snapshotDto
        );
        return new ResponseEntity<>(conflictError, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(DocumentConflictException.class)
    public ResponseEntity<ErrorDto> handleDocumentConflictException(DocumentConflictException ex) {
        ErrorDto error = new ErrorDto(
                "https://api.iurify.com/errors/conflict",
                "Document State Conflict",
                HttpStatus.CONFLICT.value(),
                ex.getMessage(),
                "DOCUMENT_NOT_COMPLETED",
                ex.getMessage(),
                generateTraceId(),
                true
        );
        return new ResponseEntity<>(error, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(UnprocessableEntityException.class)
    public ResponseEntity<ErrorDto> handleUnprocessableEntityException(UnprocessableEntityException ex) {
        ErrorDto error = new ErrorDto(
                "https://api.iurify.com/errors/unprocessable-entity",
                "Semantic Validation Error",
                HttpStatus.UNPROCESSABLE_ENTITY.value(),
                ex.getMessage(),
                ex.getCode(),
                ex.getMessage(),
                generateTraceId(),
                false
        );
        return new ResponseEntity<>(error, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    @ExceptionHandler({
            MethodArgumentNotValidException.class,
            HttpMessageNotReadableException.class,
            MethodArgumentTypeMismatchException.class,
            IllegalArgumentException.class
    })
    public ResponseEntity<ErrorDto> handleBadRequestException(Exception ex) {
        ErrorDto error = new ErrorDto(
                "https://api.iurify.com/errors/bad-request",
                "Bad Request",
                HttpStatus.BAD_REQUEST.value(),
                ex.getMessage(),
                "BAD_REQUEST",
                ex.getMessage(),
                generateTraceId(),
                false
        );
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ErrorDto> handleUnsupportedMediaType(HttpMediaTypeNotSupportedException ex) {
        ErrorDto error = new ErrorDto(
                "https://api.iurify.com/errors/unsupported-media-type",
                "Unsupported Media Type",
                HttpStatus.UNSUPPORTED_MEDIA_TYPE.value(),
                ex.getMessage(),
                "UNSUPPORTED_MEDIA_TYPE",
                ex.getMessage(),
                generateTraceId(),
                false
        );
        return new ResponseEntity<>(error, HttpStatus.UNSUPPORTED_MEDIA_TYPE);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorDto> handleGenericException(Exception ex) {
        ErrorDto error = new ErrorDto(
                "https://api.iurify.com/errors/internal-server-error",
                "Internal Server Error",
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                ex.getMessage() != null ? ex.getMessage() : "An unexpected error occurred.",
                "INTERNAL_SERVER_ERROR",
                ex.getMessage() != null ? ex.getMessage() : "An unexpected error occurred.",
                generateTraceId(),
                true
        );
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private String generateTraceId() {
        return UUID.randomUUID().toString().replace("-", "");
    }
}
