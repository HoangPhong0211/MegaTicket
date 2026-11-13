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
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private MerchandiseRepository merchandiseRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private SeatZoneRepository seatZoneRepository;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private OrderService orderService;

    private User sampleUser;
    private Event sampleEvent;
    private SeatZone sampleZone;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(UUID.randomUUID())
                .email("user@test.com")
                .role(Role.USER)
                .build();

        sampleEvent = Event.builder()
                .id(UUID.randomUUID())
                .name("Super Concert 2026")
                .status(EventStatus.UPCOMING)
                .build();

        sampleZone = SeatZone.builder()
                .id(UUID.randomUUID())
                .event(sampleEvent)
                .name("GA Zone")
                .price(new BigDecimal("500000"))
                .totalSeats(100)
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Tạo đơn hàng thành công theo số lượng (Quantity mode)")
    void createOrder_QuantityMode_Success() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order o = invocation.getArgument(0);
            if (o.getId() == null) {
                o.setId(UUID.randomUUID());
            }
            return o;
        });

        Ticket ticket1 = Ticket.builder()
                .id(UUID.randomUUID())
                .ticketCode("TICK-001")
                .price(sampleZone.getPrice())
                .zone(sampleZone)
                .status(TicketStatus.AVAILABLE)
                .build();

        Ticket ticket2 = Ticket.builder()
                .id(UUID.randomUUID())
                .ticketCode("TICK-002")
                .price(sampleZone.getPrice())
                .zone(sampleZone)
                .status(TicketStatus.AVAILABLE)
                .build();

        when(seatZoneRepository.findById(sampleZone.getId())).thenReturn(Optional.of(sampleZone));
        when(ticketRepository.findByZoneIdAndStatusWithLock(eq(sampleZone.getId()), eq(TicketStatus.AVAILABLE), any(PageRequest.class)))
                .thenReturn(List.of(ticket1, ticket2));

        CreateOrderRequest request = new CreateOrderRequest();
        CreateOrderRequest.TicketOrderItem item = new CreateOrderRequest.TicketOrderItem();
        item.setZoneId(sampleZone.getId());
        item.setQuantity(2);
        request.setTicketRequests(List.of(item));

        OrderResponse response = orderService.createOrder(sampleUser, request);

        assertNotNull(response);
        assertEquals(OrderStatus.PENDING, response.getStatus());
        assertEquals(new BigDecimal("1000000"), response.getTotalAmount());
        assertEquals(TicketStatus.PENDING, ticket1.getStatus());
        assertEquals(TicketStatus.PENDING, ticket2.getStatus());

        // Đơn PENDING và chưa thanh toán -> ticketCode phải bị ẩn (null) đối với người dùng
        assertNull(response.getTickets().get(0).getTicketCode());
        assertNull(response.getTickets().get(1).getTicketCode());

        verify(orderRepository, atLeastOnce()).save(any(Order.class));
        verify(ticketRepository, atLeastOnce()).saveAll(any());
    }

    @Test
    @DisplayName("Từ chối tạo đơn khi sự kiện đã kết thúc")
    void createOrder_Fails_WhenEventEnded() {
        sampleEvent.setStatus(EventStatus.ENDED);
        when(seatZoneRepository.findById(sampleZone.getId())).thenReturn(Optional.of(sampleZone));

        CreateOrderRequest request = new CreateOrderRequest();
        CreateOrderRequest.TicketOrderItem item = new CreateOrderRequest.TicketOrderItem();
        item.setZoneId(sampleZone.getId());
        item.setQuantity(1);
        request.setTicketRequests(List.of(item));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> orderService.createOrder(sampleUser, request));

        assertTrue(ex.getMessage().contains("đã kết thúc"));
    }

    @Test
    @DisplayName("Từ chối tạo đơn khi số lượng vé yêu cầu vượt quá vé còn trống")
    void createOrder_Fails_WhenNotEnoughSeats() {
        when(seatZoneRepository.findById(sampleZone.getId())).thenReturn(Optional.of(sampleZone));
        when(ticketRepository.findByZoneIdAndStatusWithLock(eq(sampleZone.getId()), eq(TicketStatus.AVAILABLE), any(PageRequest.class)))
                .thenReturn(List.of()); // Hết vé

        CreateOrderRequest request = new CreateOrderRequest();
        CreateOrderRequest.TicketOrderItem item = new CreateOrderRequest.TicketOrderItem();
        item.setZoneId(sampleZone.getId());
        item.setQuantity(2);
        request.setTicketRequests(List.of(item));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> orderService.createOrder(sampleUser, request));

        assertTrue(ex.getMessage().contains("không đủ 2 vé yêu cầu"));
    }

    @Test
    @DisplayName("Hủy đơn hàng PENDING thành công và giải phóng vé về AVAILABLE")
    void cancelOrder_Success() {
        Order order = Order.builder()
                .id(UUID.randomUUID())
                .user(sampleUser)
                .status(OrderStatus.PENDING)
                .orderItems(new ArrayList<>())
                .build();

        Ticket ticket = Ticket.builder()
                .id(UUID.randomUUID())
                .zone(sampleZone)
                .order(order)
                .status(TicketStatus.PENDING)
                .build();

        when(orderRepository.findById(order.getId())).thenReturn(Optional.of(order));
        when(ticketRepository.findByOrderId(order.getId())).thenReturn(List.of(ticket));

        orderService.cancelOrder(order.getId(), sampleUser);

        assertEquals(OrderStatus.CANCELLED, order.getStatus());
        assertEquals(TicketStatus.AVAILABLE, ticket.getStatus());
        assertNull(ticket.getOrder());
        verify(ticketRepository).saveAll(any());
        verify(orderRepository).save(order);
    }

    @Test
    @DisplayName("Từ chối hủy đơn khi đơn không còn ở trạng thái PENDING")
    void cancelOrder_Fails_WhenNotPending() {
        Order order = Order.builder()
                .id(UUID.randomUUID())
                .user(sampleUser)
                .status(OrderStatus.PAID)
                .build();

        when(orderRepository.findById(order.getId())).thenReturn(Optional.of(order));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> orderService.cancelOrder(order.getId(), sampleUser));

        assertTrue(ex.getMessage().contains("Chỉ có thể hủy đơn hàng đang ở trạng thái PENDING"));
    }

    @Test
    @DisplayName("Hiển thị ticketCode khi đơn hàng đã chuyển sang PAID")
    void toOrderResponse_ShowsTicketCode_WhenPaid() {
        Order order = Order.builder()
                .id(UUID.randomUUID())
                .user(sampleUser)
                .status(OrderStatus.PAID)
                .totalAmount(new BigDecimal("500000"))
                .build();

        Ticket ticket = Ticket.builder()
                .id(UUID.randomUUID())
                .ticketCode("TICK-CONFIRMED-999")
                .zone(sampleZone)
                .price(sampleZone.getPrice())
                .status(TicketStatus.SOLD)
                .build();

        OrderResponse response = orderService.toOrderResponse(order, List.of(ticket), List.of());

        assertEquals("TICK-CONFIRMED-999", response.getTickets().get(0).getTicketCode());
    }
}
