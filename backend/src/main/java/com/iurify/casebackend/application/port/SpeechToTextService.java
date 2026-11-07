package com.iurify.casebackend.application.port;

public interface SpeechToTextService {
    String transcribeAudio(byte[] audioBytes, String originalFilename, String contentType, String language);
}
