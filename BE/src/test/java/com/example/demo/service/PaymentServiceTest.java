package com.example.demo.service;

import com.example.demo.dto.response.PaymentInitResponse;
import com.example.demo.entity.Order;
import com.example.demo.entity.Payment;
import com.example.demo.entity.User;
import com.example.demo.entity.enums.OrderStatus;
import com.example.demo.entity.enums.PaymentStatus;
import com.example.demo.exception.BusinessException;
import com.example.demo.repository.OrderRepository;
import com.example.demo.repository.PaymentRepository;
import com.example.demo.repository.TicketRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private OrderService orderService;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private PaymentService paymentService;

    private User sampleUser;
    private Order sampleOrder;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(paymentService, "bankId", "BIDV");
        ReflectionTestUtils.setField(paymentService, "accountNumber", "1234567890");
        ReflectionTestUtils.setField(paymentService, "accountName", "CONG TY MEGATICKET");

        sampleUser = User.builder()
                .id(UUID.randomUUID())
                .email("buyer@example.com")
                .build();

        sampleOrder = Order.builder()
                .id(UUID.randomUUID())
                .user(sampleUser)
                .totalAmount(new BigDecimal("1000000"))
                .status(OrderStatus.PENDING)
                .expiresAt(OffsetDateTime.now().plusMinutes(10))
                .build();

        lenient().when(orderService.getOrderRepository()).thenReturn(orderRepository);
    }

    @Test
    @DisplayName("Khởi tạo thanh toán VietQR thành công")
    void initiateVietQrPayment_Success() {
        when(orderRepository.findById(sampleOrder.getId())).thenReturn(Optional.of(sampleOrder));
        when(paymentRepository.findByTransactionId(any())).thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment p = invocation.getArgument(0);
            p.setId(UUID.randomUUID());
            return p;
        });

        PaymentInitResponse response = paymentService.initiateVietQrPayment(sampleOrder.getId(), sampleUser);

        assertNotNull(response);
        assertEquals(sampleOrder.getId(), response.getOrderId());
        assertEquals(new BigDecimal("1000000"), response.getAmount());
        assertNotNull(response.getQrDataUrl());
        assertTrue(response.getTransferContent().startsWith("MT"));
    }

    @Test
    @DisplayName("Từ chối khởi tạo thanh toán khi đơn hàng đã hết hạn")
    void initiateVietQrPayment_ExpiredOrder() {
        sampleOrder.setExpiresAt(OffsetDateTime.now().minusMinutes(1));
        when(orderRepository.findById(sampleOrder.getId())).thenReturn(Optional.of(sampleOrder));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> paymentService.initiateVietQrPayment(sampleOrder.getId(), sampleUser));

        assertTrue(ex.getMessage().contains("đã hết thời hạn thanh toán"));
    }

    @Test
    @DisplayName("Webhook đến khi đơn đã hết hạn -> Đánh dấu FAILED và giải phóng tài nguyên đơn")
    void handleVietQrWebhook_ExpiredOrder_FailsAndReleases() {
        sampleOrder.setExpiresAt(OffsetDateTime.now().minusMinutes(2));
        Payment payment = Payment.builder()
                .id(UUID.randomUUID())
                .order(sampleOrder)
                .transactionId("MT12345678")
                .status(PaymentStatus.PENDING)
                .amount(sampleOrder.getTotalAmount())
                .build();

        when(paymentRepository.findByTransactionId("MT12345678")).thenReturn(Optional.of(payment));

        Map<String, Object> payload = Map.of(
                "content", "MT12345678",
                "transferAmount", "1000000"
        );

        paymentService.handleVietQrWebhook(payload);

        assertEquals(PaymentStatus.FAILED, payment.getStatus());
        verify(paymentRepository).save(payment);
        verify(orderService).releaseOrderResources(sampleOrder);
        verify(orderService, never()).getRedisTemplate();
    }
}
