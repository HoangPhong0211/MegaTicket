package com.example.demo.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * DTO nhận dữ liệu khi Admin tạo hoặc cập nhật vật phẩm lưu niệm (Merchandise).
 */
@Getter
@Setter
public class MerchandiseRequest {

    @NotBlank(message = "Tên vật phẩm không được để trống")
    @Size(max = 150, message = "Tên vật phẩm tối đa 150 ký tự")
    private String name;

    @NotNull(message = "Giá vật phẩm không được để trống")
    @DecimalMin(value = "0.0", inclusive = true, message = "Giá vật phẩm không được âm")
    private BigDecimal price;

    @NotNull(message = "Số lượng tồn kho không được để trống")
    @Min(value = 0, message = "Số lượng tồn kho không được âm")
    private Integer stockQuantity;

    private String imageUrl;
}
