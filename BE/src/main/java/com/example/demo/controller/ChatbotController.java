package com.example.demo.controller;

import com.example.demo.dto.request.ChatRequest;
import com.example.demo.dto.response.ChatResponse;
import com.example.demo.entity.User;
import com.example.demo.service.ChatbotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

/**
 * Controller Chatbot CSKH tích hợp Gemini AI.
 *
 * Hỗ trợ cả:
 * - POST /api/chat         → trả về JSON trọn vẹn
 * - POST /api/chat/stream  → trả về luồng SSE (Server-Sent Events) theo thời gian thực
 */
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ChatbotController {

    private final ChatbotService chatbotService;

    /**
     * Gửi tin nhắn tới Chatbot CSKH Gemini AI (phản hồi JSON đầy đủ).
     */
    @PostMapping
    public ResponseEntity<ChatResponse> chat(
            @Valid @RequestBody ChatRequest request,
            Authentication authentication) {
        User currentUser = extractUser(authentication);
        return ResponseEntity.ok(chatbotService.chat(request, currentUser));
    }

    /**
     * Gửi tin nhắn và nhận phản hồi stream từng đoạn chữ (SSE) để giảm thời gian chờ.
     */
    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamChat(
            @Valid @RequestBody ChatRequest request,
            Authentication authentication) {
        User currentUser = extractUser(authentication);
        return chatbotService.streamChat(request, currentUser);
    }

    /**
     * Kiểm tra trạng thái cấu hình Gemini AI (không lộ API key).
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        return ResponseEntity.ok(Map.of(
                "configured", chatbotService.isConfigured(),
                "model", chatbotService.getModelName()
        ));
    }

    private User extractUser(Authentication authentication) {
        return (authentication != null && authentication.getPrincipal() instanceof User user)
                ? user
                : null;
    }
}
