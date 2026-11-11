package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

// @EnableScheduling: bật tính năng chạy job định kỳ (@Scheduled) trong toàn ứng dụng
// Dùng bởi OrderService.releaseExpiredOrders() để dọn đơn hàng hết hạn mỗi phút
@SpringBootApplication
@EnableScheduling
public class DemoApplication {

	public static void main(String[] args) {
		SpringApplication.run(DemoApplication.class, args);
	}

}
