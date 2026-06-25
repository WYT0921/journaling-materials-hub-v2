package com.journaling.hub;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@MapperScan("com.journaling.hub.mapper")
@EnableAsync
public class JournalingMaterialsHubApplication {

    public static void main(String[] args) {
        SpringApplication.run(JournalingMaterialsHubApplication.class, args);
    }
}
