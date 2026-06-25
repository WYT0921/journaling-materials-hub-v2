package com.journaling.hub.config;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * MinIO 客户端配置
 */
@Slf4j
@Configuration
public class MinioConfig {

    /**
     * 创建 MinioClient Bean，启动时自动检查并创建 bucket
     */
    @Bean
    public MinioClient minioClient(MinioProperties properties) {
        MinioClient client = MinioClient.builder()
                .endpoint(properties.getEndpoint())
                .credentials(properties.getAccessKey(), properties.getSecretKey())
                .build();

        // 启动时检查并创建 bucket
        try {
            String bucket = properties.getBucket();
            boolean exists = client.bucketExists(
                    BucketExistsArgs.builder().bucket(bucket).build());
            if (!exists) {
                client.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
                log.info("MinIO bucket created: {}", bucket);
            } else {
                log.info("MinIO bucket already exists: {}", bucket);
            }
        } catch (Exception e) {
            log.error("MinIO bucket init failed: {}", e.getMessage());
        }

        return client;
    }
}
