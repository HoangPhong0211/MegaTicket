package com.example.demo.service;

import com.example.demo.dto.request.MerchandiseRequest;
import com.example.demo.dto.response.MerchandiseResponse;
import com.example.demo.entity.Event;
import com.example.demo.entity.Merchandise;
import com.example.demo.exception.BusinessException;
import com.example.demo.repository.EventRepository;
import com.example.demo.repository.MerchandiseRepository;
import com.example.demo.repository.OrderItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service quản lý Vật phẩm lưu niệm (Merchandise) của sự kiện.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MerchandiseService {

    private final MerchandiseRepository merchandiseRepository;
    private final EventRepository eventRepository;
    private final OrderItemRepository orderItemRepository;

    // ========== PUBLIC READ ==========

    @Transactional(readOnly = true)
    public List<MerchandiseResponse> getMerchandisesByEvent(UUID eventId) {
        if (!eventRepository.existsById(eventId)) {
            throw new BusinessException("Không tìm thấy sự kiện ID: " + eventId);
        }
        return merchandiseRepository.findByEventId(eventId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MerchandiseResponse getMerchandiseById(UUID id) {
        Merchandise merch = merchandiseRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Không tìm thấy vật phẩm ID: " + id));
        return toResponse(merch);
    }

    // ========== ADMIN CRUD ==========

    @Transactional
    public MerchandiseResponse createMerchandise(UUID eventId, MerchandiseRequest request) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy sự kiện ID: " + eventId));

        Merchandise merch = Merchandise.builder()
                .event(event)
                .name(request.getName())
                .price(request.getPrice())
                .stockQuantity(request.getStockQuantity())
                .imageUrl(request.getImageUrl())
                .build();
        merchandiseRepository.save(merch);

        log.info("Admin đã thêm vật phẩm '{}' cho sự kiện '{}'", merch.getName(), event.getName());
        return toResponse(merch);
    }

    @Transactional
    public MerchandiseResponse updateMerchandise(UUID id, MerchandiseRequest request) {
        Merchandise merch = merchandiseRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Không tìm thấy vật phẩm ID: " + id));

        merch.setName(request.getName());
        merch.setPrice(request.getPrice());
        merch.setStockQuantity(request.getStockQuantity());
        merch.setImageUrl(request.getImageUrl());
        merchandiseRepository.save(merch);

        log.info("Admin đã cập nhật vật phẩm ID {}: '{}'", id, merch.getName());
        return toResponse(merch);
    }

    @Transactional
    public void deleteMerchandise(UUID id) {
        if (!merchandiseRepository.existsById(id)) {
            throw new BusinessException("Không tìm thấy vật phẩm ID: " + id);
        }
        if (orderItemRepository.existsByMerchandiseId(id)) {
            throw new BusinessException(
                    "Không thể xóa vật phẩm đã phát sinh đơn hàng. Hãy cập nhật số lượng tồn kho về 0.");
        }
        merchandiseRepository.deleteById(id);
        log.info("Admin đã xóa vật phẩm ID: {}", id);
    }

    // ========== HELPER ==========

    private MerchandiseResponse toResponse(Merchandise merch) {
        return MerchandiseResponse.builder()
                .id(merch.getId())
                .eventId(merch.getEvent().getId())
                .eventName(merch.getEvent().getName())
                .name(merch.getName())
                .price(merch.getPrice())
                .stockQuantity(merch.getStockQuantity())
                .imageUrl(merch.getImageUrl())
                .build();
    }
}
