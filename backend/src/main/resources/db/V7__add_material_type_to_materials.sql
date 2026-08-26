-- ============================================================
-- V7: 素材一级类型（单个素材 / 合并素材）
-- ============================================================

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'materials' AND COLUMN_NAME = 'material_type');

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `materials` ADD COLUMN `material_type` VARCHAR(16) NOT NULL DEFAULT ''single'' COMMENT ''素材一级类型: single / bundle'' AFTER `category`',
  'SELECT 1 AS skipped');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'materials' AND INDEX_NAME = 'idx_materials_material_type');

SET @sql = IF(@idx_exists = 0,
  'ALTER TABLE `materials` ADD INDEX `idx_materials_material_type` (`material_type`)',
  'SELECT 1 AS skipped');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
