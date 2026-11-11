package com.example.demo.dto.request;

import com.example.demo.entity.enums.EventStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * DTO nhận dữ liệu khi Admin tạo hoặc cập nhật sự kiện.
 * Bao gồm cả danh sách khu vực ghế (zones) để tạo cùng lúc.
 */
@Getter
@Setter
public class EventRequest {

    @NotBlank(message = "Tên sự kiện không được để trống")
    @Size(max = 255, message = "Tên sự kiện tối đa 255 ký tự")
    private String name;

    private String description;

    @NotNull(message = "Thời gian bắt đầu không được để trống")
    private OffsetDateTime startTime;

    @NotNull(message = "Thời gian kết thúc không được để trống")
    private OffsetDateTime endTime;

    @NotBlank(message = "Địa điểm không được để trống")
    @Size(max = 255, message = "Địa điểm tối đa 255 ký tự")
    private String location;

    private String bannerUrl;

    // Chỉ dùng khi update, khi tạo mới sẽ mặc định UPCOMING
    private EventStatus status;

    // Danh sách zone tạo kèm theo khi tạo event mới
    // @Valid để cascade validation xuống từng SeatZoneRequest bên trong
    @Valid
    private List<SeatZoneRequest> zones;
}
