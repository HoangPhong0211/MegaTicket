package com.example.demo.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * DTO trả về sau khi Admin soát vé (Check-in QR) thành công.
 */
@Getter
@Builder
public class CheckInResponse {

    private UUID ticketId;
    private String ticketCode;
    private String seatNumber;
    private String zoneName;
    private UUID eventId;
    private String eventName;
    private String ownerFullName;
    private String ownerEmail;
    private Boolean isCheckedIn;
    private OffsetDateTime checkedInAt;
    private String message;
}
