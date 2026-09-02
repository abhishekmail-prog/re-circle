package com.recircle;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class RecircleApplication {
    public static void main(String[] args) {
        SpringApplication.run(RecircleApplication.class, args);
        System.out.println("🚀 RE-CIRCLE Backend Started Successfully!");
        System.out.println("📡 API available at: http://localhost:8080");
        System.out.println("💚 Health check: http://localhost:8080/health");
    }
}
