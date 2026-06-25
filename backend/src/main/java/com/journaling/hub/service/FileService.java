package com.journaling.hub.service;

import org.springframework.web.multipart.MultipartFile;

/**
 * 文件存储服务接口
 */
public interface FileService {

    /**
     * 上传文件
     * @param file 文件
     * @param objectName MinIO 对象路径（如 materials/original/abc.png）
     * @return 文件访问 URL
     */
    String upload(MultipartFile file, String objectName);

    /**
     * 上传字节数组
     * @param bytes 文件字节
     * @param objectName MinIO 对象路径
     * @param contentType MIME 类型
     * @return 文件访问 URL
     */
    String upload(byte[] bytes, String objectName, String contentType);

    /**
     * 删除文件
     * @param objectName MinIO 对象路径
     */
    void delete(String objectName);

    /**
     * 获取文件访问 URL
     * @param objectName MinIO 对象路径
     * @return 可访问的 URL
     */
    String getUrl(String objectName);
}
