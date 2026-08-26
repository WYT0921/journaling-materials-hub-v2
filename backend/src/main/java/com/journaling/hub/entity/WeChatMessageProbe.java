package com.journaling.hub.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("wechat_message_probe")
public class WeChatMessageProbe {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String msgId;
    private String deliveryKey;
    private String fromOpenid;
    private String toUsername;
    @TableField("message_create_time")
    private Long messageCreateTime;
    private String msgType;
    private String eventType;
    private String eventKey;
    private String mediaId;
    private String picUrl;
    private String content;
    private String format;
    private String recognition;
    private String rawXml;
    private Boolean signatureValid;
    private String downloadStatus;
    private Integer downloadHttpStatus;
    private String downloadError;
    private String detectedFileType;
    private String detectedMimeType;
    private Long fileSize;
    private Integer width;
    private Integer height;
    private Boolean isAnimated;
    private Integer frameCount;
    private String fileSha256;
    private String probeObjectKey;
    private String traceId;
    @TableField(value = "created_at", fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(value = "updated_at", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
