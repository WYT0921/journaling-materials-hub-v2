package com.journaling.hub.service.impl;

import com.journaling.hub.config.MinioProperties;
import com.journaling.hub.service.FileService;
import io.minio.*;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.concurrent.TimeUnit;

/**
 * MinIO 文件服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MinioFileServiceImpl implements FileService {

    private final MinioClient minioClient;
    private final MinioProperties properties;

    @Override
    public String upload(MultipartFile file, String objectName) {
        try (InputStream stream = file.getInputStream()) {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(properties.getBucket())
                            .object(objectName)
                            .stream(stream, file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build());
            log.info("File uploaded: {}", objectName);
            return getUrl(objectName);
        } catch (Exception e) {
            log.error("Upload failed: {}", objectName, e);
            throw new RuntimeException("文件上传失败", e);
        }
    }

    @Override
    public String upload(byte[] bytes, String objectName, String contentType) {
        try (ByteArrayInputStream stream = new ByteArrayInputStream(bytes)) {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(properties.getBucket())
                            .object(objectName)
                            .stream(stream, bytes.length, -1)
                            .contentType(contentType)
                            .build());
            log.info("File uploaded: {} ({} bytes)", objectName, bytes.length);
            return getUrl(objectName);
        } catch (Exception e) {
            log.error("Upload failed: {}", objectName, e);
            throw new RuntimeException("文件上传失败", e);
        }
    }

    @Override
    public void delete(String objectName) {
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(properties.getBucket())
                            .object(objectName)
                            .build());
            log.info("File deleted: {}", objectName);
        } catch (Exception e) {
            log.warn("Delete failed (may not exist): {}", objectName);
        }
    }

    @Override
    public String getUrl(String objectName) {
        return String.format("%s/%s/%s",
                properties.getEndpoint(), properties.getBucket(), objectName);
    }
}
