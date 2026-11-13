package com.example.demo;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@Disabled("Yêu cầu PostgreSQL và Redis container đang chạy thực tế")
class DemoApplicationTests {

	@Test
	void contextLoads() {
	}

}
