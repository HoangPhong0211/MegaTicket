package com.example.demo.dto.request;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * DTO cho một khu vực ghế (seat zone) khi tạo hoặc cập nhật.
 */
@Getter
@Setter
public class SeatZoneRequest {

    @NotBlank(message = "Tên khu vực không được để trống")
    @Size(max = 100, message = "Tên khu vực tối đa 100 ký tự")
    private String name;

    @NotNull(message = "Giá vé không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá vé phải lớn hơn 0")
    private BigDecimal price;

    @NotNull(message = "Số ghế không được để trống")
    @Min(value = 1, message = "Số ghế phải ít nhất là 1")
    private Integer totalSeats;
}
