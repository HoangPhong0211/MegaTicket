package com.example.demo.dto.response;

import lombok.Builder;
import lombok.Getter;

/**
 * DTO trả về câu trả lời từ Chatbot CSKH Gemini AI.
 */
@Getter
@Builder
public class ChatResponse {

    private String reply;

    // Lưu ở client và gửi lại qua previousInteractionId ở lượt chat tiếp theo
    private String interactionId;

    private String model;
}
