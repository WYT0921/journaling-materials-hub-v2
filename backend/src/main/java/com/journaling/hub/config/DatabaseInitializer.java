package com.journaling.hub.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * 开发环境：自动创建缺失的数据库表
 */
@Slf4j
@Component
@Profile("dev")
public class DatabaseInitializer implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        log.info("检查并创建缺失的数据库表...");

        // tools 表
        try {
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS tools (
                  id BIGINT NOT NULL AUTO_INCREMENT,
                  name VARCHAR(64) NOT NULL COMMENT '工具名称',
                  description VARCHAR(128) DEFAULT NULL COMMENT '工具描述',
                  icon VARCHAR(16) DEFAULT NULL COMMENT '图标emoji',
                  url VARCHAR(256) NOT NULL COMMENT '工具链接',
                  sort_order INT NOT NULL DEFAULT 0 COMMENT '排序序号',
                  is_default TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否为默认工具',
                  user_id BIGINT DEFAULT NULL COMMENT '所属用户',
                  status TINYINT NOT NULL DEFAULT 1 COMMENT '状态 0删除 1正常',
                  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  PRIMARY KEY (id),
                  KEY idx_tools_user_id (user_id),
                  KEY idx_tools_status (status)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """);
            log.info("tools 表已就绪");
        } catch (Exception e) {
            log.warn("tools 表创建失败（可能已存在）: {}", e.getMessage());
        }

        // favorites 表
        try {
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS favorites (
                  id BIGINT NOT NULL AUTO_INCREMENT,
                  user_id BIGINT NOT NULL COMMENT '用户ID',
                  material_id BIGINT NOT NULL COMMENT '素材ID',
                  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
                  PRIMARY KEY (id),
                  UNIQUE KEY idx_favorites_user_material (user_id, material_id),
                  KEY idx_favorites_user_id (user_id),
                  KEY idx_favorites_material_id (material_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """);
            log.info("favorites 表已就绪");
        } catch (Exception e) {
            log.warn("favorites 表创建失败（可能已存在）: {}", e.getMessage());
        }
    }
}
