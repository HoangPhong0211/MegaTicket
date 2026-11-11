package com.example.demo.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

/**
 * DTO nhận từ client khi tạo đơn hàng.
 *
 * Client gửi lên:
 * - Danh sách ticket muốn mua (theo zone, server tự chọn ghế cụ thể)
 * - Danh sách merchandise kèm theo (optional)
 *
 * Ví dụ request body:
 * {
 *   "ticketRequests": [{ "zoneId": "uuid", "quantity": 2 }],
 *   "merchandiseRequests": [{ "merchandiseId": "uuid", "quantity": 1 }]
 * }
 */
@Getter
@Setter
public class CreateOrderRequest {

    @NotEmpty(message = "Phải chọn ít nhất 1 vé")
    @Valid
    private List<TicketOrderItem> ticketRequests;

    // Merchandise là optional (có thể null hoặc rỗng)
    @Valid
    private List<MerchandiseOrderItem> merchandiseRequests;

    @Getter
    @Setter
    public static class TicketOrderItem {

        @NotNull(message = "Zone ID không được để trống")
        private UUID zoneId;

        // Dùng khi đặt theo số lượng (hệ thống tự chọn ghế AVAILABLE)
        @Min(value = 1, message = "Số lượng vé ít nhất là 1")
        @Max(value = 10, message = "Tối đa 10 vé mỗi zone trong một đơn")
        private Integer quantity;

        // Dùng khi user chọn đích danh từng ghế trên sơ đồ ghế (optional)
        @Size(max = 10, message = "Tối đa 10 vé mỗi zone trong một đơn")
        private List<UUID> ticketIds;
    }

    @Getter
    @Setter
    public static class MerchandiseOrderItem {

        @NotNull(message = "Merchandise ID không được để trống")
        private UUID merchandiseId;

        @NotNull(message = "Số lượng không được để trống")
        @Min(value = 1, message = "Số lượng ít nhất là 1")
        private Integer quantity;
    }
}
