package com.example.demo.service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import com.example.demo.dto.request.EventRequest;
import com.example.demo.dto.request.SeatZoneRequest;
import com.example.demo.dto.response.EventResponse;
import com.example.demo.dto.response.SeatResponse;
import com.example.demo.entity.Event;
import com.example.demo.entity.Merchandise;
import com.example.demo.entity.SeatZone;
import com.example.demo.entity.Ticket;
import com.example.demo.entity.enums.TicketStatus;
import com.example.demo.exception.BusinessException;
import com.example.demo.repository.EventRepository;
import com.example.demo.repository.MerchandiseRepository;
import com.example.demo.repository.SeatZoneRepository;
import com.example.demo.repository.TicketRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service xử lý nghiệp vụ Sự kiện (Event).
 *
 * Trách nhiệm:
 * - CRUD sự kiện (Admin)
 * - Xem danh sách & chi tiết (Public)
 * - Mapping Entity ↔ DTO (tránh lộ dữ liệu không cần thiết)
 * - Tự động sinh vé (Ticket) khi tạo khu vực ghế
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EventService {

    private final EventRepository eventRepository;
    private final SeatZoneRepository seatZoneRepository;
    private final TicketRepository ticketRepository;
    private final MerchandiseRepository merchandiseRepository;

    // ========== PUBLIC APIS ==========

    /**
     * Lấy tất cả sự kiện (kèm thông tin zone và số ghế còn trống).
     * Dùng cho màn hình danh sách sự kiện của FE.
     */
    @Transactional(readOnly = true)
    public List<EventResponse> getAllEvents() {
        return eventRepository.findAll()
                .stream()
                .map(this::toEventResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lấy chi tiết một sự kiện theo ID.
     */
    @Transactional(readOnly = true)
    public EventResponse getEventById(UUID id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Không tìm thấy sự kiện với ID: " + id));
        return toEventResponse(event);
    }

    /**
     * Lấy sơ đồ ghế (danh sách vé) của một zone trong sự kiện.
     */
    @Transactional(readOnly = true)
    public List<SeatResponse> getSeatsByZone(UUID eventId, UUID zoneId) {
        SeatZone zone = seatZoneRepository.findById(zoneId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy khu vực ghế ID: " + zoneId));

        if (!zone.getEvent().getId().equals(eventId)) {
            throw new BusinessException("Khu vực ghế không thuộc sự kiện này.");
        }

        return ticketRepository.findByZoneIdOrderBySeatNumberAscTicketCodeAsc(zoneId)
                .stream()
                .map(t -> SeatResponse.builder()
                        .id(t.getId())
                        .seatNumber(t.getSeatNumber())
                        .price(t.getPrice())
                        .status(t.getStatus())
                        .build())
                .collect(Collectors.toList());
    }

    // ========== ADMIN APIS ==========

    /**
     * Tạo sự kiện mới kèm danh sách zone.
     * Với mỗi zone, tự động sinh sẵn các Ticket (vé) với trạng thái AVAILABLE.
     *
     * Lý do sinh vé sẵn thay vì tạo lúc đặt:
     * Mô hình "inventory-based" — vé là tài nguyên hữu hạn được quản lý như kho hàng.
     * Giúp dễ dàng khóa (PENDING) và giải phóng (AVAILABLE) ghế.
     */
    @Transactional
    public EventResponse createEvent(EventRequest request) {
        // Validate thời gian
        if (request.getEndTime().isBefore(request.getStartTime())) {
            throw new BusinessException("Thời gian kết thúc phải sau thời gian bắt đầu.");
        }

        // Tạo Event entity
        Event event = Event.builder()
                .name(request.getName())
                .description(request.getDescription())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .location(request.getLocation())
                .bannerUrl(request.getBannerUrl())
                .build();
        eventRepository.save(event);

        // Tạo zones và sinh vé nếu có
        if (!CollectionUtils.isEmpty(request.getZones())) {
            for (SeatZoneRequest zoneReq : request.getZones()) {
                createZoneWithTickets(event, zoneReq);
            }
        }

        log.info("Đã tạo sự kiện: '{}' với {} zone", event.getName(),
                request.getZones() != null ? request.getZones().size() : 0);
        return toEventResponse(event);
    }

    /**
     * Thêm zone mới vào sự kiện đã tồn tại.
     */
    @Transactional
    public EventResponse addZoneToEvent(UUID eventId, SeatZoneRequest request) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy sự kiện với ID: " + eventId));

        createZoneWithTickets(event, request);
        log.info("Đã thêm zone '{}' vào sự kiện '{}'", request.getName(), event.getName());
        return toEventResponse(event);
    }

    /**
     * Cập nhật thông tin sự kiện (không thay đổi zones).
     */
    @Transactional
    public EventResponse updateEvent(UUID id, EventRequest request) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Không tìm thấy sự kiện với ID: " + id));

        if (request.getEndTime() != null && request.getStartTime() != null
                && request.getEndTime().isBefore(request.getStartTime())) {
            throw new BusinessException("Thời gian kết thúc phải sau thời gian bắt đầu.");
        }

        // Chỉ cập nhật field không null
        if (request.getName() != null) event.setName(request.getName());
        if (request.getDescription() != null) event.setDescription(request.getDescription());
        if (request.getStartTime() != null) event.setStartTime(request.getStartTime());
        if (request.getEndTime() != null) event.setEndTime(request.getEndTime());
        if (request.getLocation() != null) event.setLocation(request.getLocation());
        if (request.getBannerUrl() != null) event.setBannerUrl(request.getBannerUrl());
        if (request.getStatus() != null) event.setStatus(request.getStatus());

        eventRepository.save(event);
        log.info("Đã cập nhật sự kiện: '{}'", event.getName());
        return toEventResponse(event);
    }

    /**
     * Xóa sự kiện (cascade xóa zones và tickets theo DB schema).
     */
    @Transactional
    public void deleteEvent(UUID id) {
        if (!eventRepository.existsById(id)) {
            throw new BusinessException("Không tìm thấy sự kiện với ID: " + id);
        }
        eventRepository.deleteById(id);
        log.info("Đã xóa sự kiện ID: {}", id);
    }

    // ========== PRIVATE HELPERS ==========

    /**
     * Tạo SeatZone và sinh đủ số lượng Ticket tương ứng.
     * Mỗi vé có ticket_code duy nhất: {zoneName}-{số thứ tự 4 chữ số}.
     * Ghế GA (General Admission - đứng tự do) không có seat_number.
     */
    private void createZoneWithTickets(Event event, SeatZoneRequest zoneReq) {
        SeatZone zone = SeatZone.builder()
                .event(event)
                .name(zoneReq.getName())
                .price(zoneReq.getPrice())
                .totalSeats(zoneReq.getTotalSeats())
                .build();
        seatZoneRepository.save(zone);

        // Sinh vé - dùng prefix từ tên zone + 6 ký tự từ zone.getId()
        // để đảm bảo ticket_code luôn UNIQUE giữa các sự kiện khác nhau.
        String zonePrefix = zone.getName().replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
        if (zonePrefix.isEmpty()) zonePrefix = "ZONE";
        if (zonePrefix.length() > 6) zonePrefix = zonePrefix.substring(0, 6);
        String zoneSuffix = zone.getId().toString().replace("-", "").substring(0, 6).toUpperCase();

        List<Ticket> tickets = new ArrayList<>();
        for (int i = 1; i <= zoneReq.getTotalSeats(); i++) {
            boolean isGA = zone.getName().toUpperCase().contains("GA");
            tickets.add(Ticket.builder()
                    .zone(zone)
                    .ticketCode(String.format("MT-%s-%s-%04d", zonePrefix, zoneSuffix, i))
                    .seatNumber(isGA ? null : zone.getName() + "-" + i) // GA không có số ghế
                    .price(zone.getPrice())
                    .status(TicketStatus.AVAILABLE)
                    .build());
        }
        ticketRepository.saveAll(tickets);
    }

    /**
     * Chuyển Event entity → EventResponse DTO.
     * Tính toán availableSeats từ DB cho mỗi zone và kèm danh sách merchandise.
     */
    public EventResponse toEventResponse(Event event) {
        List<SeatZone> zones = seatZoneRepository.findByEventId(event.getId());

        List<EventResponse.SeatZoneResponse> zoneResponses = zones.stream()
                .map(zone -> {
                    long available = ticketRepository.countByZoneIdAndStatus(
                            zone.getId(), TicketStatus.AVAILABLE);
                    return EventResponse.SeatZoneResponse.builder()
                            .id(zone.getId())
                            .name(zone.getName())
                            .price(zone.getPrice())
                            .totalSeats(zone.getTotalSeats())
                            .availableSeats((int) available)
                            .build();
                })
                .collect(Collectors.toList());

        List<Merchandise> merchandises = merchandiseRepository.findByEventId(event.getId());
        List<EventResponse.MerchandiseSummary> merchResponses = merchandises.stream()
                .map(m -> EventResponse.MerchandiseSummary.builder()
                        .id(m.getId())
                        .name(m.getName())
                        .price(m.getPrice())
                        .stockQuantity(m.getStockQuantity())
                        .imageUrl(m.getImageUrl())
                        .build())
                .collect(Collectors.toList());

        return EventResponse.builder()
                .id(event.getId())
                .name(event.getName())
                .description(event.getDescription())
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .location(event.getLocation())
                .bannerUrl(event.getBannerUrl())
                .status(event.getStatus())
                .createdAt(event.getCreatedAt())
                .seatZones(zoneResponses)
                .merchandises(merchResponses)
                .build();
    }
}
