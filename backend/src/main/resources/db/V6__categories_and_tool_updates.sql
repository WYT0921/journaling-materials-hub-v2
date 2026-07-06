-- ============================================================
-- V6: 分类表 + 工具表 category 字段 + 默认数据
-- ============================================================

-- 1. 创建分类表
CREATE TABLE IF NOT EXISTS `categories` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(32) NOT NULL COMMENT '分类名称',
  `type` VARCHAR(16) NOT NULL COMMENT '分类类型: material / tool',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 0=禁用 1=正常',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序序号',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_categories_name_type` (`name`, `type`),
  KEY `idx_categories_type` (`type`),
  KEY `idx_categories_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 工具表新增 category 字段（仅当列不存在时执行）
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tools' AND COLUMN_NAME = 'category');

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `tools` ADD COLUMN `category` VARCHAR(32) DEFAULT NULL COMMENT ''分类名称'' AFTER `url`',
  'SELECT 1 AS skipped');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. 种子数据：默认素材分类（IGNORE 跳过已存在的）
INSERT IGNORE INTO categories (name, type, status, sort_order) VALUES
('贴纸', 'material', 1, 1),
('便签', 'material', 1, 2),
('背景纸', 'material', 1, 3),
('胶带', 'material', 1, 4),
('印章', 'material', 1, 5),
('模板', 'material', 1, 6);

-- 4. 种子数据：默认工具分类
INSERT IGNORE INTO categories (name, type, status, sort_order) VALUES
('写作与项目', 'tool', 1, 1),
('在线设计', 'tool', 1, 2),
('配色与创意', 'tool', 1, 3),
('字体资源', 'tool', 1, 4),
('素材资源', 'tool', 1, 5);

-- 5. 种子数据：默认工具（迁移到数据库，IGNORE 跳过已存在的）
INSERT IGNORE INTO tools (name, description, icon, url, category, sort_order, is_default, user_id, status) VALUES
('Notion', '万能笔记和项目管理工具', '📝', 'https://www.notion.so', '写作与项目', 1, 1, NULL, 1),
('Canva', '在线设计平台，海量模板', '🎨', 'https://www.canva.cn', '在线设计', 2, 1, NULL, 1),
('Color Hunt', '精选配色方案集合', '🎯', 'https://colorhunt.co', '配色与创意', 3, 1, NULL, 1),
('Coolors', '快速生成配色方案', '🌈', 'https://coolors.co', '配色与创意', 4, 1, NULL, 1),
('Google Fonts', '免费开源字体库', '🔤', 'https://fonts.google.com', '字体资源', 5, 1, NULL, 1),
('DaFont', '英文字体下载站', '✒️', 'https://www.dafont.com', '字体资源', 6, 1, NULL, 1),
('Freepik', '免费矢量图和 PSD 素材', '🖼️', 'https://www.freepik.com', '素材资源', 7, 1, NULL, 1),
('Unsplash', '高质量免费图片', '📷', 'https://unsplash.com', '素材资源', 8, 1, NULL, 1);
