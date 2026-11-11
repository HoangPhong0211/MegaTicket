package com.example.demo.dto.response;

import com.example.demo.entity.enums.EventStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO trả về thông tin sự kiện cho client.
 * Dùng DTO thay vì trả trực tiếp Entity để:
 * 1. Kiểm soát chính xác field nào được phép lộ ra ngoài
 * 2. Tránh vòng lặp JSON (circular reference) giữa các entity quan hệ
 * 3. Khớp với cấu trúc frontend đang sử dụng (seatZones, merchandises)
 */
@Getter
@Builder
public class EventResponse {

    private UUID id;
    private String name;
    private String description;
    private OffsetDateTime startTime;
    private OffsetDateTime endTime;
    private String location;
    private String bannerUrl;
    private EventStatus status;
    private OffsetDateTime createdAt;

    // Danh sách khu vực ghế kèm theo số ghế còn trống (khớp tên field seatZones với FE)
    private List<SeatZoneResponse> seatZones;

    // Danh sách vật phẩm lưu niệm bán kèm trong sự kiện
    private List<MerchandiseSummary> merchandises;

    @Getter
    @Builder
    public static class SeatZoneResponse {
        private UUID id;
        private String name;
        private BigDecimal price;
        private Integer totalSeats;
        private Integer availableSeats;
    }

    @Getter
    @Builder
    public static class MerchandiseSummary {
        private UUID id;
        private String name;
        private BigDecimal price;
        private Integer stockQuantity;
        private String imageUrl;
    }
}
