CREATE TABLE IF NOT EXISTS `text_assets` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `content` TEXT NOT NULL COMMENT '颜文字或 Emoji 内容',
  `content_hash` CHAR(64) NOT NULL COMMENT '规范化内容 SHA-256',
  `type` VARCHAR(16) NOT NULL COMMENT 'kaomoji / emoji',
  `category` VARCHAR(32) NOT NULL COMMENT '分类名称',
  `tags` JSON DEFAULT NULL COMMENT '搜索标签',
  `source` VARCHAR(32) NOT NULL DEFAULT 'manual' COMMENT 'manual / cuteinternet / emojidb',
  `source_url` VARCHAR(512) DEFAULT NULL,
  `risk_level` VARCHAR(16) NOT NULL DEFAULT 'safe' COMMENT 'safe / mild',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '0待审核 1已发布 2已拒绝 3已停用',
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_text_assets_content_hash` (`content_hash`),
  KEY `idx_text_assets_public` (`type`, `status`, `category`, `sort_order`, `id`),
  KEY `idx_text_assets_source` (`source`),
  KEY `idx_text_assets_risk` (`risk_level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO categories (name, type, status, sort_order) VALUES
('可爱', 'kaomoji', 1, 1), ('开心', 'kaomoji', 1, 2), ('难过', 'kaomoji', 1, 3),
('生气', 'kaomoji', 1, 4), ('动物', 'kaomoji', 1, 5), ('动作', 'kaomoji', 1, 6),
('爱心', 'emoji', 1, 1), ('星星', 'emoji', 1, 2), ('花朵', 'emoji', 1, 3),
('天气', 'emoji', 1, 4), ('食物', 'emoji', 1, 5), ('装饰', 'emoji', 1, 6);
