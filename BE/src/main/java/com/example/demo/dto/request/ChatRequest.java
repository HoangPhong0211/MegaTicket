package com.example.demo.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/**
 * DTO nhận câu hỏi từ người dùng gửi lên Chatbot CSKH Gemini AI.
 */
@Getter
@Setter
public class ChatRequest {

    @NotBlank(message = "Nội dung tin nhắn không được để trống")
    @Size(max = 2000, message = "Tin nhắn tối đa 2000 ký tự")
    private String message;

    /**
     * ID của lượt hội thoại trước (từ ChatResponse.interactionId).
     * Truyền lên để Gemini tự động nhớ ngữ cảnh hội thoại nhiều lượt.
     */
    private String previousInteractionId;
}
