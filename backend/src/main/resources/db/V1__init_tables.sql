-- ============================================================
-- V1: 初始建表
-- 对应 Node.js server/migrations/ 中的 4 个 Sequelize 迁移
-- ============================================================

-- 用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `openid` VARCHAR(64) NOT NULL,
  `nickname` VARCHAR(64) DEFAULT NULL,
  `avatar_url` VARCHAR(256) DEFAULT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `member_type` ENUM('normal','monthly','yearly','permanent') NOT NULL DEFAULT 'normal',
  `member_expire_time` DATETIME DEFAULT NULL,
  `points` INT NOT NULL DEFAULT 0,
  `download_count` INT NOT NULL DEFAULT 0,
  `status` TINYINT NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_openid` (`openid`),
  KEY `idx_users_member_type` (`member_type`),
  KEY `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 素材表
CREATE TABLE IF NOT EXISTS `materials` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(128) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `image_url` VARCHAR(256) NOT NULL,
  `thumbnail_url` VARCHAR(256) DEFAULT NULL,
  `category` VARCHAR(32) DEFAULT NULL,
  `tags` JSON DEFAULT NULL,
  `is_premium` TINYINT(1) NOT NULL DEFAULT 0,
  `download_count` INT NOT NULL DEFAULT 0,
  `status` TINYINT NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_materials_category` (`category`),
  KEY `idx_materials_is_premium` (`is_premium`),
  KEY `idx_materials_status` (`status`),
  KEY `idx_materials_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 下载记录表
CREATE TABLE IF NOT EXISTS `downloads` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `material_id` BIGINT NOT NULL,
  `downloaded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_downloads_user_material` (`user_id`, `material_id`),
  KEY `idx_downloads_user_id` (`user_id`),
  KEY `idx_downloads_material_id` (`material_id`),
  KEY `idx_downloads_downloaded_at` (`downloaded_at`),
  CONSTRAINT `fk_downloads_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_downloads_material` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 兑换码表
CREATE TABLE IF NOT EXISTS `redeem_codes` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(32) NOT NULL,
  `type` VARCHAR(16) NOT NULL,
  `status` TINYINT NOT NULL DEFAULT 0,
  `user_id` BIGINT DEFAULT NULL,
  `used_time` DATETIME DEFAULT NULL,
  `expire_time` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_redeem_codes_code` (`code`),
  KEY `idx_redeem_codes_status` (`status`),
  KEY `idx_redeem_codes_user_id` (`user_id`),
  CONSTRAINT `fk_redeem_codes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
