package com.journaling.hub.config;

import org.junit.jupiter.api.Test;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.RejectedExecutionException;

import static org.junit.jupiter.api.Assertions.assertThrows;

class WeChatProbeExecutorConfigTest {
    @Test
    void rejectsWhenBoundedQueueIsFull() throws Exception {
        WeChatOfficialProperties properties = new WeChatOfficialProperties();
        properties.setExecutorCorePoolSize(1);
        properties.setExecutorMaxPoolSize(1);
        properties.setExecutorQueueCapacity(1);
        var executor = new WeChatProbeExecutorConfig().wechatMediaProbeExecutor(properties);
        CountDownLatch block = new CountDownLatch(1);
        try {
            executor.execute(() -> await(block));
            executor.execute(() -> await(block));
            assertThrows(RejectedExecutionException.class, () -> executor.execute(() -> {}));
        } finally {
            block.countDown();
            if (executor instanceof org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor taskExecutor) taskExecutor.shutdown();
        }
    }

    private static void await(CountDownLatch latch) {
        try { latch.await(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}
