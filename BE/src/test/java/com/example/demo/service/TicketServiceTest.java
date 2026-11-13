package com.example.demo.service;

import com.example.demo.dto.response.CheckInResponse;
import com.example.demo.dto.response.ETicketResponse;
import com.example.demo.entity.*;
import com.example.demo.entity.enums.EventStatus;
import com.example.demo.entity.enums.OrderStatus;
import com.example.demo.entity.enums.Role;
import com.example.demo.entity.enums.TicketStatus;
import com.example.demo.exception.BusinessException;
import com.example.demo.repository.EventRepository;
import com.example.demo.repository.OrderRepository;
import com.example.demo.repository.TicketRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TicketServiceTest {

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private EventRepository eventRepository;

    @InjectMocks
    private TicketService ticketService;

    private User sampleUser;
    private Event sampleEvent;
    private SeatZone sampleZone;
    private Order sampleOrder;
    private Ticket sampleTicket;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .fullName("Nguyen Van A")
                .role(Role.USER)
                .build();

        sampleEvent = Event.builder()
                .id(UUID.randomUUID())
                .name("Live Concert 2026")
                .location("My Dinh Stadium")
                .status(EventStatus.UPCOMING)
                .startTime(OffsetDateTime.now().plusDays(2))
                .endTime(OffsetDateTime.now().plusDays(2).plusHours(3))
                .build();

        sampleZone = SeatZone.builder()
                .id(UUID.randomUUID())
                .event(sampleEvent)
                .name("VIP A")
                .price(new BigDecimal("1500000"))
                .build();

        sampleOrder = Order.builder()
                .id(UUID.randomUUID())
                .user(sampleUser)
                .status(OrderStatus.PAID)
                .build();

        sampleTicket = Ticket.builder()
                .id(UUID.randomUUID())
                .ticketCode("TICK-VIP-001")
                .seatNumber("VIP-1")
                .zone(sampleZone)
                .order(sampleOrder)
                .status(TicketStatus.SOLD)
                .isCheckedIn(false)
                .price(sampleZone.getPrice())
                .build();
    }

    @Test
    @DisplayName("Soát vé thành công khi vé SOLD và chưa check-in")
    void checkInByTicketCode_Success() {
        when(ticketRepository.findByTicketCodeWithLock("TICK-VIP-001"))
                .thenReturn(Optional.of(sampleTicket));

        CheckInResponse response = ticketService.checkInByTicketCode("TICK-VIP-001");

        assertNotNull(response);
        assertEquals(sampleTicket.getTicketCode(), response.getTicketCode());
        assertEquals("VIP A", response.getZoneName());
        assertEquals(sampleUser.getFullName(), response.getOwnerFullName());
        assertTrue(sampleTicket.getIsCheckedIn());
        assertNotNull(sampleTicket.getCheckedInAt());
        verify(ticketRepository).save(sampleTicket);
    }

    @Test
    @DisplayName("Từ chối soát vé khi vé đã được check-in trước đó")
    void checkInByTicketCode_AlreadyCheckedIn() {
        sampleTicket.setIsCheckedIn(true);
        sampleTicket.setCheckedInAt(OffsetDateTime.now().minusMinutes(10));
        when(ticketRepository.findByTicketCodeWithLock("TICK-VIP-001"))
                .thenReturn(Optional.of(sampleTicket));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> ticketService.checkInByTicketCode("TICK-VIP-001"));

        assertTrue(ex.getMessage().contains("đã được check-in trước đó"));
    }

    @Test
    @DisplayName("Từ chối soát vé khi vé chưa được bán hoặc đơn chưa thanh toán")
    void checkInByTicketCode_TicketNotSold() {
        sampleTicket.setStatus(TicketStatus.AVAILABLE);
        sampleTicket.setOrder(null);
        when(ticketRepository.findByTicketCodeWithLock("TICK-VIP-001"))
                .thenReturn(Optional.of(sampleTicket));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> ticketService.checkInByTicketCode("TICK-VIP-001"));

        assertTrue(ex.getMessage().contains("chưa được thanh toán hợp lệ"));
    }

    @Test
    @DisplayName("Từ chối soát vé khi sự kiện đã kết thúc")
    void checkInByTicketCode_EventEnded() {
        sampleEvent.setStatus(EventStatus.ENDED);
        when(ticketRepository.findByTicketCodeWithLock("TICK-VIP-001"))
                .thenReturn(Optional.of(sampleTicket));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> ticketService.checkInByTicketCode("TICK-VIP-001"));

        assertTrue(ex.getMessage().contains("đã kết thúc"));
    }

    @Test
    @DisplayName("Lấy vé điện tử theo đơn hàng thành công")
    void getETicketsByOrder_Success() {
        when(orderRepository.findById(sampleOrder.getId()))
                .thenReturn(Optional.of(sampleOrder));
        when(ticketRepository.findByOrderId(sampleOrder.getId()))
                .thenReturn(List.of(sampleTicket));

        List<ETicketResponse> responses = ticketService.getETicketsByOrder(sampleOrder.getId(), sampleUser);

        assertEquals(1, responses.size());
        assertEquals("TICK-VIP-001", responses.getFirst().getTicketCode());
    }

    @Test
    @DisplayName("Từ chối xem vé điện tử khi đơn chưa thanh toán (PENDING)")
    void getETicketsByOrder_Fails_WhenPending() {
        sampleOrder.setStatus(OrderStatus.PENDING);
        when(orderRepository.findById(sampleOrder.getId()))
                .thenReturn(Optional.of(sampleOrder));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> ticketService.getETicketsByOrder(sampleOrder.getId(), sampleUser));

        assertTrue(ex.getMessage().contains("chưa thanh toán"));
    }
}
