package com.example.demo.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/**
 * DTO nhận mã vé khi Admin quét QR soát vé tại cổng sự kiện.
 */
@Getter
@Setter
public class CheckInRequest {

    @NotBlank(message = "Mã vé (ticketCode) không được để trống")
    private String ticketCode;
}
