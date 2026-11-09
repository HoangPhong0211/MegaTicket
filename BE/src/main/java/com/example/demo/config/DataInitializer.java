package com.example.demo.config;

import com.example.demo.entity.*;
import com.example.demo.entity.enums.EventStatus;
import com.example.demo.entity.enums.Role;
import com.example.demo.entity.enums.TicketStatus;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final SeatZoneRepository seatZoneRepository;
    private final TicketRepository ticketRepository;
    private final MerchandiseRepository merchandiseRepository;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Dữ liệu mẫu đã tồn tại, bỏ qua bước khởi tạo (seeding).");
            return;
        }

        log.info("Bắt đầu khởi tạo dữ liệu mẫu cho MegaTicket...");

        // 1. Tạo User mẫu
        User admin = User.builder()
                .email("admin@megaticket.vn")
                .passwordHash("$2a$10$sampleHashedPasswordForDemoOnly")
                .fullName("Quản trị viên MegaTicket")
                .phone("0901234567")
                .role(Role.ADMIN)
                .build();
        userRepository.save(admin);

        // 2. Tạo Event mẫu
        Event event = Event.builder()
                .name("MegaTicket Live Music Concert 2026")
                .description("Đêm nhạc hội hoành tráng quy tụ các nghệ sĩ hàng đầu.")
                .location("Sân vận động Quốc gia Mỹ Đình, Hà Nội")
                .bannerUrl("https://images.unsplash.com/photo-1540039155733-5bb30b53aa14")
                .startTime(OffsetDateTime.now().plusDays(10))
                .endTime(OffsetDateTime.now().plusDays(10).plusHours(4))
                .status(EventStatus.UPCOMING)
                .build();
        eventRepository.save(event);

        // 3. Tạo Khu vực ghế (Seat Zones)
        SeatZone vipZone = SeatZone.builder()
                .event(event)
                .name("VIP A")
                .price(new BigDecimal("2000000.00"))
                .totalSeats(10)
                .build();
        seatZoneRepository.save(vipZone);

        SeatZone gaZone = SeatZone.builder()
                .event(event)
                .name("GA B (Đứng tự do)")
                .price(new BigDecimal("800000.00"))
                .totalSeats(50)
                .build();
        seatZoneRepository.save(gaZone);

        // 4. Sinh sẵn vé cho khu vực VIP A (Ticket Lifecycle: AVAILABLE)
        List<Ticket> sampleTickets = new ArrayList<>();
        for (int i = 1; i <= 5; i++) {
            sampleTickets.add(Ticket.builder()
                    .zone(vipZone)
                    .ticketCode(String.format("TICK-2026-VIP-%03d", i))
                    .seatNumber("VIP-A-" + i)
                    .price(vipZone.getPrice())
                    .status(TicketStatus.AVAILABLE)
                    .isCheckedIn(false)
                    .build());
        }
        ticketRepository.saveAll(sampleTickets);

        // 5. Tạo Vật phẩm lưu niệm (Merchandise)
        Merchandise shirt = Merchandise.builder()
                .event(event)
                .name("Áo phông MegaTicket Limited Edition 2026")
                .price(new BigDecimal("299000.00"))
                .stockQuantity(100)
                .imageUrl("https://images.unsplash.com/photo-1521572267360-ee0c2909d518")
                .build();
        merchandiseRepository.save(shirt);

        log.info("Đã khởi tạo thành công: 1 Admin, 1 Event, 2 SeatZones, 5 Tickets, 1 Merchandise!");
    }
}
