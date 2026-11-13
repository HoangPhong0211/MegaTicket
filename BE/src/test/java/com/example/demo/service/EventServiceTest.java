package com.example.demo.service;

import com.example.demo.dto.request.SeatZoneRequest;
import com.example.demo.entity.Event;
import com.example.demo.entity.SeatZone;
import com.example.demo.entity.Ticket;
import com.example.demo.entity.enums.EventStatus;
import com.example.demo.entity.enums.TicketStatus;
import com.example.demo.exception.BusinessException;
import com.example.demo.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EventServiceTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private SeatZoneRepository seatZoneRepository;

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private MerchandiseRepository merchandiseRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @InjectMocks
    private EventService eventService;

    private UUID eventId;
    private Event sampleEvent;

    @BeforeEach
    void setUp() {
        eventId = UUID.randomUUID();
        sampleEvent = Event.builder()
                .id(eventId)
                .name("Concert 2026")
                .status(EventStatus.UPCOMING)
                .seatZones(new ArrayList<>())
                .merchandises(new ArrayList<>())
                .build();
    }

    @Test
    @DisplayName("Xóa sự kiện thành công khi không có đơn hàng liên quan")
    void deleteEvent_Success() {
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(sampleEvent));
        when(ticketRepository.existsByZoneEventIdAndOrderIsNotNull(eventId)).thenReturn(false);
        when(ticketRepository.existsByZoneEventIdAndStatusNot(eventId, TicketStatus.AVAILABLE)).thenReturn(false);
        when(orderItemRepository.existsByMerchandiseEventId(eventId)).thenReturn(false);

        assertDoesNotThrow(() -> eventService.deleteEvent(eventId));

        verify(ticketRepository).deleteByZoneEventId(eventId);
        verify(merchandiseRepository).deleteByEventId(eventId);
        verify(seatZoneRepository).deleteByEventId(eventId);
        verify(eventRepository).delete(sampleEvent);
    }

    @Test
    @DisplayName("Từ chối xóa sự kiện khi vé đã phát sinh đơn hàng")
    void deleteEvent_Fails_WhenTicketsHaveOrders() {
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(sampleEvent));
        when(ticketRepository.existsByZoneEventIdAndOrderIsNotNull(eventId)).thenReturn(true);

        BusinessException exception = assertThrows(BusinessException.class, () -> eventService.deleteEvent(eventId));
        assertTrue(exception.getMessage().contains("đã phát sinh đơn hàng"));

        verify(ticketRepository, never()).deleteByZoneEventId(any());
        verify(eventRepository, never()).delete(any());
    }

    @Test
    @DisplayName("Từ chối xóa sự kiện khi vật phẩm lưu niệm đã có người mua")
    void deleteEvent_Fails_WhenMerchandiseHasOrders() {
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(sampleEvent));
        when(ticketRepository.existsByZoneEventIdAndOrderIsNotNull(eventId)).thenReturn(false);
        when(ticketRepository.existsByZoneEventIdAndStatusNot(eventId, TicketStatus.AVAILABLE)).thenReturn(false);
        when(orderItemRepository.existsByMerchandiseEventId(eventId)).thenReturn(true);

        BusinessException exception = assertThrows(BusinessException.class, () -> eventService.deleteEvent(eventId));
        assertTrue(exception.getMessage().contains("vật phẩm"));

        verify(eventRepository, never()).delete(any());
    }

    @Test
    @DisplayName("Cập nhật khu vực ghế và tự động mở rộng vé khi tăng tổng số ghế")
    void updateZone_ExpandsSeats() {
        UUID zoneId = UUID.randomUUID();
        SeatZone zone = SeatZone.builder()
                .id(zoneId)
                .event(sampleEvent)
                .name("VIP")
                .price(new BigDecimal("1000000"))
                .totalSeats(5)
                .build();

        sampleEvent.getSeatZones().add(zone);

        SeatZoneRequest request = new SeatZoneRequest();
        request.setName("VIP Diamond");
        request.setPrice(new BigDecimal("1200000"));
        request.setTotalSeats(10); // Tăng từ 5 lên 10

        when(eventRepository.findById(eventId)).thenReturn(Optional.of(sampleEvent));
        when(seatZoneRepository.findById(zoneId)).thenReturn(Optional.of(zone));
        when(ticketRepository.findByZoneIdAndStatus(zoneId, TicketStatus.AVAILABLE)).thenReturn(List.of());

        eventService.updateZone(eventId, zoneId, request);

        assertEquals("VIP Diamond", zone.getName());
        assertEquals(new BigDecimal("1200000"), zone.getPrice());
        assertEquals(10, zone.getTotalSeats());
        verify(ticketRepository, atLeastOnce()).saveAll(any());
        verify(seatZoneRepository).save(zone);
    }

    @Test
    @DisplayName("Xóa khu vực ghế thành công khi chưa có vé được đặt")
    void deleteZone_Success() {
        UUID zoneId = UUID.randomUUID();
        SeatZone zone = SeatZone.builder()
                .id(zoneId)
                .event(sampleEvent)
                .name("GA")
                .build();
        sampleEvent.getSeatZones().add(zone);

        when(eventRepository.findById(eventId)).thenReturn(Optional.of(sampleEvent));
        when(seatZoneRepository.findById(zoneId)).thenReturn(Optional.of(zone));
        when(ticketRepository.existsByZoneIdAndOrderIsNotNull(zoneId)).thenReturn(false);
        when(ticketRepository.existsByZoneIdAndStatusNot(zoneId, TicketStatus.AVAILABLE)).thenReturn(false);

        assertDoesNotThrow(() -> eventService.deleteZone(eventId, zoneId));

        verify(ticketRepository).deleteByZoneId(zoneId);
        verify(seatZoneRepository).delete(zone);
    }
}
