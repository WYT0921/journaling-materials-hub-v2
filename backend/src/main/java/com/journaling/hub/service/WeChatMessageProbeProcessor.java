package com.journaling.hub.service;

import com.journaling.hub.dto.WeChatMediaDownload;
import com.journaling.hub.dto.WeChatProbeFileInfo;
import com.journaling.hub.entity.WeChatMessageProbe;
import com.journaling.hub.mapper.WeChatMessageProbeMapper;
import com.journaling.hub.util.WeChatProbeFileInspector;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class WeChatMessageProbeProcessor {
    private final WeChatMessageProbeMapper mapper;
    private final WeChatOfficialMediaClient mediaClient;
    private final FileService fileService;

    public void process(Long id) {
        WeChatMessageProbe probe = mapper.selectById(id);
        if (probe == null || probe.getMediaId() == null || probe.getMediaId().isBlank()) return;
        String objectKey = null;
        long started = System.currentTimeMillis();
        try {
            updateStatus(id, "DOWNLOADING", null, null);
            WeChatMediaDownload download = mediaClient.download(probe.getMediaId());
            WeChatProbeFileInfo info = WeChatProbeFileInspector.inspect(download.bytes());
            objectKey = "probe/wechat/" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"))
                    + "/" + safeName(probe.getMsgId()) + "." + info.getExtension();
            fileService.upload(download.bytes(), objectKey, info.getMimeType());

            WeChatMessageProbe update = new WeChatMessageProbe();
            update.setId(id);
            update.setDownloadStatus("DOWNLOADED");
            update.setDownloadHttpStatus(download.httpStatus());
            update.setDetectedFileType(info.getFileType());
            update.setDetectedMimeType(info.getMimeType());
            update.setFileSize(info.getFileSize());
            update.setWidth(info.getWidth());
            update.setHeight(info.getHeight());
            update.setIsAnimated(info.getAnimated());
            update.setFrameCount(info.getFrameCount());
            update.setFileSha256(info.getSha256());
            update.setProbeObjectKey(objectKey);
            if (mapper.updateById(update) != 1) {
                fileService.delete(objectKey);
                throw new IllegalStateException("验证记录最终状态更新失败");
            }
            log.info("微信素材探针完成 traceId={}, type={}, size={}, elapsedMs={}", probe.getTraceId(),
                    info.getFileType(), info.getFileSize(), System.currentTimeMillis() - started);
        } catch (Exception e) {
            if (objectKey != null) fileService.delete(objectKey);
            Integer status = e instanceof WeChatMediaDownloadException downloadError ? downloadError.getHttpStatus() : null;
            try { updateStatus(id, "FAILED", status, safeError(e)); }
            catch (Exception updateError) { log.error("微信探针失败状态写入失败 traceId={}", probe.getTraceId(), updateError); }
            log.warn("微信素材探针失败 traceId={}, reason={}, elapsedMs={}", probe.getTraceId(), safeError(e),
                    System.currentTimeMillis() - started);
        }
    }

    public void markRejected(Long id) {
        updateStatus(id, "FAILED", null, "任务队列已满");
    }

    private void updateStatus(Long id, String status, Integer httpStatus, String error) {
        WeChatMessageProbe update = new WeChatMessageProbe();
        update.setId(id); update.setDownloadStatus(status);
        update.setDownloadHttpStatus(httpStatus); update.setDownloadError(error);
        mapper.updateById(update);
    }
    private static String safeName(String msgId) {
        return msgId != null && msgId.matches("[A-Za-z0-9_-]{1,64}") ? msgId : UUID.randomUUID().toString();
    }
    private static String safeError(Exception e) {
        String text = e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage();
        return text.length() > 1000 ? text.substring(0, 1000) : text;
    }
}
