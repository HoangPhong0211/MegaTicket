package com.example.demo.service;

import com.example.demo.dto.request.CreateOrderRequest;
import com.example.demo.dto.response.OrderResponse;
import com.example.demo.entity.*;
import com.example.demo.entity.enums.EventStatus;
import com.example.demo.entity.enums.OrderStatus;
import com.example.demo.entity.enums.Role;
import com.example.demo.entity.enums.TicketStatus;
import com.example.demo.exception.BusinessException;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service xử lý nghiệp vụ Đơn hàng (Order).
 *
 * Đây là service phức tạp nhất trong hệ thống vì phải giải quyết:
 * 1. Race condition: nhiều user cùng chọn ghế một zone
 * 2. Timeout: đơn chưa thanh toán phải tự động hủy sau 10 phút
 * 3. Consistency: ghế phải được giải phóng đúng lúc, không bị "mắc kẹt"
 *
 * Giải pháp kỹ thuật:
 * - Pessimistic Lock (DB level): ngăn 2 transaction cùng lấy 1 ghế
 * - Redis TTL (Application level): theo dõi đơn chờ, trigger giải phóng ghế
 * - @Scheduled: job chạy định kỳ dọn các đơn hết hạn
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private static final int ORDER_TIMEOUT_MINUTES = 10;
    // Redis key pattern: order:pending:{orderId} → value: orderId (TTL 10 phút)
    private static final String REDIS_ORDER_KEY_PREFIX = "order:pending:";

    private final OrderRepository orderRepository;
    private final TicketRepository ticketRepository;
    private final MerchandiseRepository merchandiseRepository;
    private final OrderItemRepository orderItemRepository;
    private final SeatZoneRepository seatZoneRepository;
    private final StringRedisTemplate redisTemplate;

    // ========== TẠO ĐƠN HÀNG ==========

    /**
     * Tạo đơn hàng mới — đây là nghiệp vụ cốt lõi nhất.
     *
     * Luồng:
     * 1. Với mỗi zone, dùng Pessimistic Lock lấy N vé AVAILABLE
     * 2. Đổi trạng thái vé → PENDING
     * 3. Tính tổng tiền (vé + merchandise)
     * 4. Tạo Order với expires_at = now + 10 phút
     * 5. Gán vé và merchandise vào Order
     * 6. Lưu Redis key với TTL để theo dõi timeout
     *
     * @param user    user đang đăng nhập (lấy từ SecurityContext)
     * @param request dữ liệu đơn hàng từ client
     */
    @Transactional
    public OrderResponse createOrder(User user, CreateOrderRequest request) {
        List<Ticket> reservedTickets = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        // === BƯỚC 1: Xử lý từng zone — lấy vé bằng Pessimistic Lock ===
        for (CreateOrderRequest.TicketOrderItem ticketReq : request.getTicketRequests()) {
            SeatZone zone = seatZoneRepository.findById(ticketReq.getZoneId())
                    .orElseThrow(() -> new BusinessException(
                            "Không tìm thấy khu vực ghế ID: " + ticketReq.getZoneId()));

            if (zone.getEvent().getStatus() == EventStatus.ENDED) {
                throw new BusinessException("Sự kiện '" + zone.getEvent().getName() + "' đã kết thúc.");
            }

            List<Ticket> selectedTickets;
            if (ticketReq.getTicketIds() != null && !ticketReq.getTicketIds().isEmpty()) {
                // Mode A: User chọn đích danh từng ghế trên sơ đồ
                Set<UUID> uniqueIds = new HashSet<>(ticketReq.getTicketIds());
                if (uniqueIds.size() != ticketReq.getTicketIds().size()) {
                    throw new BusinessException("Danh sách ghế chọn bị trùng lặp.");
                }

                selectedTickets = ticketRepository.findAllByIdWithLock(ticketReq.getTicketIds());
                if (selectedTickets.size() != ticketReq.getTicketIds().size()) {
                    throw new BusinessException("Một hoặc nhiều ghế không tồn tại.");
                }

                for (Ticket t : selectedTickets) {
                    if (!t.getZone().getId().equals(zone.getId())) {
                        throw new BusinessException("Ghế '" + t.getSeatNumber() + "' không thuộc khu vực '" + zone.getName() + "'.");
                    }
                    if (t.getStatus() != TicketStatus.AVAILABLE) {
                        throw new BusinessException("Ghế '" + (t.getSeatNumber() != null ? t.getSeatNumber() : t.getTicketCode())
                                + "' hiện không còn trống.");
                    }
                }
            } else if (ticketReq.getQuantity() != null && ticketReq.getQuantity() >= 1) {
                // Mode B: Đặt theo số lượng — tự động lấy N vé AVAILABLE với Pessimistic Write Lock
                selectedTickets = ticketRepository.findByZoneIdAndStatusWithLock(
                        zone.getId(),
                        TicketStatus.AVAILABLE,
                        PageRequest.of(0, ticketReq.getQuantity())
                );

                if (selectedTickets.size() < ticketReq.getQuantity()) {
                    throw new BusinessException(
                            "Khu vực '" + zone.getName() + "' chỉ còn " +
                            selectedTickets.size() + " vé, không đủ " + ticketReq.getQuantity() + " vé yêu cầu.");
                }
            } else {
                throw new BusinessException("Phải cung cấp số lượng vé (quantity) hoặc danh sách ghế (ticketIds).");
            }

            // Đổi trạng thái vé → PENDING (đang giữ chỗ)
            selectedTickets.forEach(t -> t.setStatus(TicketStatus.PENDING));
            ticketRepository.saveAll(selectedTickets);
            reservedTickets.addAll(selectedTickets);

            // Cộng tiền vé vào tổng (dùng giá tại thời điểm đặt từ zone hoặc ticket)
            for (Ticket t : selectedTickets) {
                totalAmount = totalAmount.add(t.getPrice());
            }
        }

        // === BƯỚC 2: Tạo Order ===
        Order order = Order.builder()
                .user(user)
                .totalAmount(totalAmount) // sẽ cộng thêm merchandise bên dưới
                .status(OrderStatus.PENDING)
                .expiresAt(OffsetDateTime.now().plusMinutes(ORDER_TIMEOUT_MINUTES))
                .build();
        orderRepository.save(order);

        // === BƯỚC 3: Gán vé vào Order ===
        reservedTickets.forEach(t -> t.setOrder(order));
        ticketRepository.saveAll(reservedTickets);

        // === BƯỚC 4: Xử lý Merchandise (nếu có) ===
        List<OrderItem> orderItems = new ArrayList<>();
        if (request.getMerchandiseRequests() != null) {
            for (CreateOrderRequest.MerchandiseOrderItem merchReq : request.getMerchandiseRequests()) {
                Merchandise merch = merchandiseRepository.findByIdWithLock(merchReq.getMerchandiseId())
                        .orElseThrow(() -> new BusinessException(
                                "Không tìm thấy vật phẩm ID: " + merchReq.getMerchandiseId()));

                // Kiểm tra tồn kho
                if (merch.getStockQuantity() < merchReq.getQuantity()) {
                    throw new BusinessException(
                            "Vật phẩm '" + merch.getName() + "' chỉ còn " +
                            merch.getStockQuantity() + " sản phẩm.");
                }

                // Trừ tồn kho
                merch.setStockQuantity(merch.getStockQuantity() - merchReq.getQuantity());
                merchandiseRepository.save(merch);

                // Tạo OrderItem — snapshot giá lúc đặt (tránh ảnh hưởng khi admin đổi giá sau)
                OrderItem item = OrderItem.builder()
                        .order(order)
                        .merchandise(merch)
                        .quantity(merchReq.getQuantity())
                        .price(merch.getPrice()) // snapshot giá
                        .build();
                orderItems.add(item);

                BigDecimal merchTotal = merch.getPrice().multiply(BigDecimal.valueOf(merchReq.getQuantity()));
                totalAmount = totalAmount.add(merchTotal);
            }
            orderItemRepository.saveAll(orderItems);
        }

        // Cập nhật tổng tiền sau khi tính merchandise
        order.setTotalAmount(totalAmount);
        orderRepository.save(order);

        // === BƯỚC 5: Lưu Redis key với TTL 10 phút ===
        // Key này dùng để: (a) xác nhận đơn còn trong thời hạn, (b) trigger cleanup khi hết hạn
        String redisKey = REDIS_ORDER_KEY_PREFIX + order.getId();
        redisTemplate.opsForValue().set(redisKey, order.getId().toString(),
                Duration.ofMinutes(ORDER_TIMEOUT_MINUTES));

        log.info("Tạo đơn hàng {} thành công cho user {}, {} vé, tổng: {}đ",
                order.getId(), user.getEmail(), reservedTickets.size(), totalAmount);

        return toOrderResponse(order, reservedTickets, orderItems);
    }

    // ========== XEM ĐƠN HÀNG ==========

    /**
     * User xem danh sách đơn hàng của mình.
     */
    @Transactional(readOnly = true)
    public List<OrderResponse> getMyOrders(User user) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(order -> {
                    List<Ticket> tickets = ticketRepository.findByOrderId(order.getId());
                    List<OrderItem> items = order.getOrderItems();
                    return toOrderResponse(order, tickets, items);
                })
                .collect(Collectors.toList());
    }

    /**
     * Lấy chi tiết một đơn hàng (kiểm tra quyền sở hữu).
     */
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(UUID orderId, User user) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy đơn hàng ID: " + orderId));

        // Kiểm tra đơn này có thuộc về user đang đăng nhập (hoặc là ADMIN) không
        if (!order.getUser().getId().equals(user.getId()) && user.getRole() != Role.ADMIN) {
            throw new BusinessException("Bạn không có quyền xem đơn hàng này.");
        }

        List<Ticket> tickets = ticketRepository.findByOrderId(orderId);
        return toOrderResponse(order, tickets, order.getOrderItems());
    }

    // ========== HỦY ĐƠN & GIẢI PHÓNG GHẾ ==========

    /**
     * Hủy đơn hàng PENDING và giải phóng ghế về AVAILABLE.
     * User chỉ có thể hủy đơn của chính mình và chỉ khi còn PENDING.
     */
    @Transactional
    public void cancelOrder(UUID orderId, User user) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy đơn hàng ID: " + orderId));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new BusinessException("Bạn không có quyền hủy đơn hàng này.");
        }

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new BusinessException("Chỉ có thể hủy đơn hàng đang ở trạng thái PENDING.");
        }

        releaseOrderResources(order);
        log.info("Đơn hàng {} đã bị hủy bởi user {}", orderId, user.getEmail());
    }

    /**
     * Scheduled job: chạy mỗi phút, tìm và hủy các đơn PENDING đã hết hạn.
     *
     * @Scheduled(fixedDelay): chạy sau mỗi khoảng thời gian kể từ lần chạy trước.
     * Khác với fixedRate (chạy đúng mỗi N ms, bất kể lần trước chạy xong chưa).
     */
    @Scheduled(fixedDelay = 60_000) // mỗi 60 giây
    @Transactional
    public void releaseExpiredOrders() {
        List<Order> expiredOrders = orderRepository.findByStatusAndExpiresAtBefore(
                OrderStatus.PENDING, OffsetDateTime.now());

        if (!expiredOrders.isEmpty()) {
            log.info("Dọn dẹp {} đơn hàng hết hạn...", expiredOrders.size());
            expiredOrders.forEach(this::releaseOrderResources);
        }
    }

    /**
     * Giải phóng tài nguyên khi hủy đơn:
     * - Vé: PENDING → AVAILABLE
     * - Merchandise: hoàn trả stock
     * - Order: PENDING → CANCELLED
     * - Redis: xóa key
     */
    private void releaseOrderResources(Order order) {
        // Giải phóng vé
        List<Ticket> tickets = ticketRepository.findByOrderId(order.getId());
        tickets.forEach(t -> {
            t.setStatus(TicketStatus.AVAILABLE);
            t.setOrder(null);
        });
        ticketRepository.saveAll(tickets);

        // Hoàn trả merchandise stock
        order.getOrderItems().forEach(item -> {
            Merchandise merch = item.getMerchandise();
            merch.setStockQuantity(merch.getStockQuantity() + item.getQuantity());
            merchandiseRepository.save(merch);
        });

        // Hủy đơn
        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);

        // Xóa Redis key
        redisTemplate.delete(REDIS_ORDER_KEY_PREFIX + order.getId());
    }

    // ========== ADMIN ==========

    /**
     * Admin xem tất cả đơn hàng (hỗ trợ lọc theo trạng thái nếu truyền status).
     */
    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders(OrderStatus status) {
        List<Order> orders = (status != null)
                ? orderRepository.findByStatusOrderByCreatedAtDesc(status)
                : orderRepository.findAllByOrderByCreatedAtDesc();
        return orders.stream()
                .map(order -> {
                    List<Ticket> tickets = ticketRepository.findByOrderId(order.getId());
                    return toOrderResponse(order, tickets, order.getOrderItems());
                })
                .collect(Collectors.toList());
    }

    /**
     * Admin xem chi tiết bất kỳ đơn hàng nào.
     */
    @Transactional(readOnly = true)
    public OrderResponse getOrderByIdForAdmin(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy đơn hàng ID: " + orderId));
        List<Ticket> tickets = ticketRepository.findByOrderId(orderId);
        return toOrderResponse(order, tickets, order.getOrderItems());
    }

    // ========== HELPER ==========

    /**
     * Chuyển Order entity + tickets + items → OrderResponse DTO.
     * Phương thức này cũng được PaymentService gọi sau khi thanh toán thành công.
     */
    public OrderResponse toOrderResponse(Order order, List<Ticket> tickets, List<OrderItem> items) {
        List<OrderResponse.TicketInfo> ticketInfos = tickets.stream()
                .map(t -> OrderResponse.TicketInfo.builder()
                        .ticketId(t.getId())
                        .ticketCode(t.getTicketCode())
                        .seatNumber(t.getSeatNumber())
                        .zoneName(t.getZone().getName())
                        .price(t.getPrice())
                        .build())
                .collect(Collectors.toList());

        List<OrderResponse.MerchInfo> merchInfos = (items != null ? items : List.<OrderItem>of()).stream()
                .map(i -> OrderResponse.MerchInfo.builder()
                        .merchandiseId(i.getMerchandise().getId())
                        .merchandiseName(i.getMerchandise().getName())
                        .quantity(i.getQuantity())
                        .price(i.getPrice())
                        .build())
                .collect(Collectors.toList());

        return OrderResponse.builder()
                .id(order.getId())
                .status(order.getStatus())
                .totalAmount(order.getTotalAmount())
                .createdAt(order.getCreatedAt())
                .expiresAt(order.getExpiresAt())
                .qrCodeUrl(order.getQrCodeUrl())
                .tickets(ticketInfos)
                .merchandises(merchInfos)
                .build();
    }

    // Package-private để PaymentService dùng
    OrderRepository getOrderRepository() { return orderRepository; }
    TicketRepository getTicketRepository() { return ticketRepository; }
    StringRedisTemplate getRedisTemplate() { return redisTemplate; }
    String getRedisKeyPrefix() { return REDIS_ORDER_KEY_PREFIX; }
}
