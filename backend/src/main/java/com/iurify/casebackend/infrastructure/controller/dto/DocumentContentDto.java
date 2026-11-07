package com.iurify.casebackend.infrastructure.controller.dto;

public class DocumentContentDto {
    private String format;
    private String body;

    public DocumentContentDto() {}

    public DocumentContentDto(String format, String body) {
        this.format = format;
        this.body = body;
    }

    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }
    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }
}
