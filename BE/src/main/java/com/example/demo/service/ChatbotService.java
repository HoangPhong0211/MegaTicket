package com.example.demo.service;

import com.example.demo.dto.request.ChatRequest;
import com.example.demo.dto.response.ChatResponse;
import com.example.demo.entity.*;
import com.example.demo.entity.enums.TicketStatus;
import com.example.demo.exception.BusinessException;
import com.example.demo.repository.*;
import com.google.genai.Client;
import com.google.genai.gaos.models.interactions.CreateModelInteraction;
import com.google.genai.gaos.models.interactions.ErrorEvent;
import com.google.genai.gaos.models.interactions.GenerationConfig;
import com.google.genai.gaos.models.interactions.Interaction;
import com.google.genai.gaos.models.interactions.InteractionCompletedEvent;
import com.google.genai.gaos.models.interactions.InteractionCreatedEvent;
import com.google.genai.gaos.models.interactions.InteractionSSEEvent;
import com.google.genai.gaos.models.interactions.InteractionSSEStreamEvent;
import com.google.genai.gaos.models.interactions.InteractionsInput;
import com.google.genai.gaos.models.interactions.Model;
import com.google.genai.gaos.models.interactions.StepDelta;
import com.google.genai.gaos.models.interactions.StepDeltaData;
import com.google.genai.gaos.models.interactions.TextDelta;
import com.google.genai.gaos.models.interactions.ThinkingLevel;
import com.google.genai.gaos.models.operations.CreateInteractionRequestBody;
import com.google.genai.gaos.models.operations.CreateInteractionResponse;
import com.google.genai.gaos.utils.EventStream;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * Service tích hợp Gemini AI (Interactions API) làm Chatbot CSKH cho MegaTicket.
 *
 * Tối ưu tốc độ phản hồi:
 * - Mặc định dùng model gemini-3.5-flash-lite + ThinkingLevel.MINIMAL (độ trễ thấp nhất).
 * - Khởi tạo sẵn Gemini Client ngay khi app boot (@PostConstruct) để tránh cold-start.
 * - Cache danh mục sự kiện 30 giây nhằm tránh lặp N+1 query mỗi lượt chat.
 * - Hỗ trợ SSE Streaming (/api/chat/stream) để đẩy từng đoạn chữ về FE ngay lập tức.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChatbotService {

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final long CATALOG_CACHE_TTL_MS = 30_000L;
    private static final long SSE_TIMEOUT_MS = 90_000L;

    private final EventRepository eventRepository;
    private final SeatZoneRepository seatZoneRepository;
    private final TicketRepository ticketRepository;
    private final MerchandiseRepository merchandiseRepository;
    private final OrderRepository orderRepository;
    private final PlatformTransactionManager transactionManager;

    @Value("${app.gemini.api-key:}")
    private String apiKey;

    @Value("${app.gemini.model:gemini-3.5-flash-lite}")
    private String modelName;

    @Value("${app.gemini.thinking-level:MINIMAL}")
    private String configuredThinkingLevel;

    private volatile Client geminiClient;
    private volatile String cachedEventCatalog = "";
    private volatile long catalogCachedAtMs = 0L;

    @PostConstruct
    public void initClient() {
        if (isConfigured()) {
            getOrCreateClient();
            log.info("Đã khởi tạo sẵn Gemini AI Client với model '{}' (thinking: {}).",
                    modelName, resolveThinkingLevel());
        }
    }

    public boolean isConfigured() {
        return StringUtils.hasText(apiKey);
    }

    public String getModelName() {
        return modelName;
    }

    /**
     * Phản hồi đồng bộ (giữ lại cho client không dùng streaming).
     */
    public ChatResponse chat(ChatRequest request, User currentUser) {
        Client client = getOrCreateClient();
        String systemInstruction = buildSystemInstruction(currentUser);
        long startNs = System.nanoTime();

        try {
            CreateModelInteraction params = buildInteractionParams(request, systemInstruction, false);
            Interaction interaction = client.interactions
                    .create(CreateInteractionRequestBody.of(params))
                    .interaction()
                    .orElseThrow(() -> new BusinessException("Gemini AI không trả về phản hồi."));

            long elapsedMs = (System.nanoTime() - startNs) / 1_000_000L;
            log.debug("Gemini chat ({}) hoàn tất trong {} ms", modelName, elapsedMs);

            String replyText = interaction.outputText().orElse(
                    "Xin lỗi, hiện tại tôi chưa thể xử lý câu hỏi này. Bạn vui lòng thử diễn đạt lại nhé!");
            String interactionId = interaction.id().orElse(null);

            return ChatResponse.builder()
                    .reply(replyText)
                    .interactionId(interactionId)
                    .model(modelName)
                    .build();
        } catch (BusinessException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Lỗi khi gọi Gemini AI Interactions API: {}", ex.getMessage(), ex);
            throw new BusinessException(
                    "Không thể kết nối tới trợ lý AI lúc này. Vui lòng thử lại sau hoặc kiểm tra GEMINI_API_KEY.");
        }
    }

    /**
     * Phản hồi theo luồng SSE (Server-Sent Events) để FE hiển thị chữ ngay lập tức.
     *
     * Các event phát về client:
     * - delta: { "text": "..." }
     * - done:  { "interactionId": "...", "model": "..." }
     * - error: { "message": "..." }
     */
    public SseEmitter streamChat(ChatRequest request, User currentUser) {
        Client client = getOrCreateClient();
        // Đọc DB trong transaction ngắn trước khi mở luồng mạng tới Gemini
        String systemInstruction = buildSystemInstruction(currentUser);
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT_MS);

        Thread.startVirtualThread(() -> {
            long startNs = System.nanoTime();
            String latestInteractionId = null;

            try {
                CreateModelInteraction params = buildInteractionParams(request, systemInstruction, true);
                CreateInteractionResponse response =
                        client.interactions.create(CreateInteractionRequestBody.of(params));

                try (EventStream<InteractionSSEStreamEvent> stream = response.events()) {
                    for (InteractionSSEStreamEvent streamEvent : stream) {
                        InteractionSSEEvent event = streamEvent.data().orElse(null);
                        if (event == null) continue;

                        if (event instanceof InteractionCreatedEvent created) {
                            latestInteractionId = created.interaction()
                                    .flatMap(i -> i.id())
                                    .orElse(latestInteractionId);
                        } else if (event instanceof StepDelta stepDelta) {
                            StepDeltaData data = stepDelta.delta().orElse(null);
                            if (data instanceof TextDelta textDelta) {
                                String chunk = textDelta.text().orElse("");
                                if (!chunk.isEmpty()) {
                                    emitter.send(SseEmitter.event()
                                            .name("delta")
                                            .data(Map.of("text", chunk)));
                                }
                            }
                        } else if (event instanceof InteractionCompletedEvent completed) {
                            latestInteractionId = completed.interaction()
                                    .flatMap(i -> i.id())
                                    .orElse(latestInteractionId);
                        } else if (event instanceof ErrorEvent errEvent) {
                            String errMsg = errEvent.error()
                                    .map(Object::toString)
                                    .orElse("Gemini AI trả về lỗi khi tạo phản hồi.");
                            log.warn("Gemini stream ErrorEvent: {}", errMsg);
                            sendSseErrorAndComplete(emitter,
                                    "Trợ lý AI gặp gián đoạn khi xử lý câu hỏi. Vui lòng thử lại.");
                            return;
                        }
                    }
                }

                long elapsedMs = (System.nanoTime() - startNs) / 1_000_000L;
                log.debug("Gemini stream ({}) hoàn tất trong {} ms", modelName, elapsedMs);

                emitter.send(SseEmitter.event()
                        .name("done")
                        .data(Map.of(
                                "interactionId", latestInteractionId != null ? latestInteractionId : "",
                                "model", modelName
                        )));
                emitter.complete();
            } catch (Exception ex) {
                log.error("Lỗi trong lúc stream Gemini AI: {}", ex.getMessage(), ex);
                sendSseErrorAndComplete(emitter,
                        "Không thể kết nối tới trợ lý AI lúc này. Vui lòng thử lại sau.");
            }
        });

        return emitter;
    }

    // ========== PRIVATE HELPERS ==========

    private CreateModelInteraction buildInteractionParams(
            ChatRequest request, String systemInstruction, boolean stream) {
        CreateModelInteraction.Builder builder = CreateModelInteraction.builder()
                .model(Model.of(modelName))
                .systemInstruction(systemInstruction)
                .input(InteractionsInput.of(request.getMessage().trim()))
                .generationConfig(GenerationConfig.builder()
                        .thinkingLevel(resolveThinkingLevel())
                        .maxOutputTokens(512)
                        .build());

        if (stream) {
            builder.stream(true);
        }

        if (StringUtils.hasText(request.getPreviousInteractionId())) {
            builder.previousInteractionId(request.getPreviousInteractionId().trim());
        }

        return builder.build();
    }

    private ThinkingLevel resolveThinkingLevel() {
        String raw = configuredThinkingLevel != null ? configuredThinkingLevel.trim().toUpperCase() : "MINIMAL";
        // gemini-3.8-flash và gemini-4-argon không hỗ trợ MINIMAL, tự hạ về LOW
        boolean supportsMinimal = !modelName.startsWith("gemini-3.8") && !modelName.startsWith("gemini-4");
        return switch (raw) {
            case "MINIMAL" -> supportsMinimal ? ThinkingLevel.MINIMAL : ThinkingLevel.LOW;
            case "LOW" -> ThinkingLevel.LOW;
            case "MEDIUM" -> ThinkingLevel.MEDIUM;
            case "HIGH" -> ThinkingLevel.HIGH;
            default -> supportsMinimal ? ThinkingLevel.MINIMAL : ThinkingLevel.LOW;
        };
    }

    private void sendSseErrorAndComplete(SseEmitter emitter, String message) {
        try {
            emitter.send(SseEmitter.event()
                    .name("error")
                    .data(Map.of("message", message)));
            emitter.complete();
        } catch (IOException ioEx) {
            emitter.completeWithError(ioEx);
        }
    }

    private Client getOrCreateClient() {
        if (!isConfigured()) {
            throw new BusinessException(
                    "Chatbot CSKH chưa được cấu hình GEMINI_API_KEY. Vui lòng thiết lập biến môi trường GEMINI_API_KEY.");
        }
        if (geminiClient == null) {
            synchronized (this) {
                if (geminiClient == null) {
                    geminiClient = Client.builder().apiKey(apiKey.trim()).build();
                }
            }
        }
        return geminiClient;
    }

    @PreDestroy
    public void closeClient() {
        if (geminiClient != null) {
            try {
                geminiClient.close();
            } catch (Exception e) {
                log.debug("Lỗi đóng Gemini Client: {}", e.getMessage());
            }
        }
    }

    private String buildSystemInstruction(User currentUser) {
        String catalog = getCachedEventCatalog();
        String userSection = currentUser != null ? buildUserOrdersSection(currentUser) : "";

        return """
                Bạn là Trợ lý CSKH chính thức của nền tảng bán vé sự kiện MegaTicket.
                Trả lời thân thiện, đi thẳng vào trọng tâm, súc tích (ưu tiên 2-4 câu hoặc gạch đầu dòng ngắn gọn) bằng tiếng Việt.

                QUY ĐỊNH MEGATICKET:
                - Đặt vé: Chọn sự kiện, chọn khu vực/ghế và vật phẩm lưu niệm kèm theo (nếu có).
                - Giữ chỗ: Tối đa 10 phút ở trạng thái PENDING; quá hạn hệ thống tự hủy và mở lại ghế.
                - Thanh toán: Quét VietQR đúng nội dung chuyển khoản để tự động xác nhận qua webhook.
                - Vé điện tử: Đơn PAID có mã QR tại mục Vé của tôi để check-in tại cổng.

                NGUYÊN TẮC: Chỉ dùng dữ liệu thật bên dưới, không tự bịa sự kiện, giá vé hoặc khuyến mãi.
                """ + "\n" + catalog + userSection;
    }

    private String getCachedEventCatalog() {
        long now = Instant.now().toEpochMilli();
        if (now - catalogCachedAtMs < CATALOG_CACHE_TTL_MS && !cachedEventCatalog.isEmpty()) {
            return cachedEventCatalog;
        }

        synchronized (this) {
            now = Instant.now().toEpochMilli();
            if (now - catalogCachedAtMs < CATALOG_CACHE_TTL_MS && !cachedEventCatalog.isEmpty()) {
                return cachedEventCatalog;
            }
            TransactionTemplate tx = new TransactionTemplate(transactionManager);
            tx.setReadOnly(true);
            String refreshed = tx.execute(status -> queryEventCatalogFromDb());
            cachedEventCatalog = refreshed != null ? refreshed : "";
            catalogCachedAtMs = now;
            return cachedEventCatalog;
        }
    }

    private String queryEventCatalogFromDb() {
        StringBuilder sb = new StringBuilder("=== SỰ KIỆN HIỆN CÓ ===\n");
        List<Event> events = eventRepository.findAll();
        if (events.isEmpty()) {
            sb.append("(Chưa có sự kiện nào.)\n");
            return sb.toString();
        }

        for (Event event : events) {
            sb.append(String.format("- %s [%s] | %s | %s → %s%n",
                    event.getName(),
                    event.getStatus(),
                    event.getLocation(),
                    event.getStartTime().format(TIME_FMT),
                    event.getEndTime().format(TIME_FMT)));

            List<SeatZone> zones = seatZoneRepository.findByEventId(event.getId());
            for (SeatZone z : zones) {
                long available = ticketRepository.countByZoneIdAndStatus(z.getId(), TicketStatus.AVAILABLE);
                sb.append(String.format("  * Vé %s: %,.0fđ (còn %d/%d)%n",
                        z.getName(), z.getPrice(), available, z.getTotalSeats()));
            }

            List<Merchandise> merchs = merchandiseRepository.findByEventId(event.getId());
            for (Merchandise m : merchs) {
                sb.append(String.format("  * Vật phẩm %s: %,.0fđ (kho: %d)%n",
                        m.getName(), m.getPrice(), m.getStockQuantity()));
            }
        }
        return sb.toString();
    }

    private String buildUserOrdersSection(User currentUser) {
        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        tx.setReadOnly(true);
        return tx.execute(status -> {
            StringBuilder sb = new StringBuilder("\n=== KHÁCH HÀNG HIỆN TẠI ===\n");
            sb.append("Tên: ").append(currentUser.getFullName()).append("\n");
            List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId());
            if (orders.isEmpty()) {
                sb.append("Đơn hàng: Chưa có đơn nào.\n");
            } else {
                orders.stream().limit(5).forEach(o -> sb.append(String.format(
                        "* Đơn MT%s | %s | %,.0fđ | %s%n",
                        o.getId().toString().replace("-", "").substring(0, 8).toUpperCase(),
                        o.getStatus(),
                        o.getTotalAmount(),
                        o.getCreatedAt() != null ? o.getCreatedAt().format(TIME_FMT) : "N/A")));
            }
            return sb.toString();
        });
    }
}
