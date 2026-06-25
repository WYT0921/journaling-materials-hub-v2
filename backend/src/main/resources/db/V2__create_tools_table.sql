-- ============================================================
-- V2: 工具表
-- 用于存储用户自定义的工具
-- 默认工具在服务端代码中硬编码维护
-- ============================================================

CREATE TABLE IF NOT EXISTS `tools` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(64) NOT NULL COMMENT '工具名称',
  `description` VARCHAR(128) DEFAULT NULL COMMENT '工具描述',
  `icon` VARCHAR(16) DEFAULT NULL COMMENT '图标（emoji）',
  `url` VARCHAR(256) NOT NULL COMMENT '工具链接',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序序号',
  `is_default` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否为默认工具',
  `user_id` BIGINT DEFAULT NULL COMMENT '所属用户（自定义工具用）',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：0=删除 1=正常',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tools_user_id` (`user_id`),
  KEY `idx_tools_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
