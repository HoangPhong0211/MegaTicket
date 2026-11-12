package com.example.demo.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO hiển thị thông tin vật phẩm lưu niệm (Merchandise).
 */
@Getter
@Builder
public class MerchandiseResponse {

    private UUID id;
    private UUID eventId;
    private String eventName;
    private String name;
    private BigDecimal price;
    private Integer stockQuantity;
    private String imageUrl;
}
