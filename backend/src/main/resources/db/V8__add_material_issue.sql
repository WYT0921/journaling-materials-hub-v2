-- ============================================================
-- V8: 素材上传年份与期号
-- ============================================================

SET @year_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'materials' AND COLUMN_NAME = 'issue_year');
SET @sql = IF(@year_exists = 0,
  'ALTER TABLE `materials` ADD COLUMN `issue_year` INT NULL COMMENT ''上传年份'' AFTER `material_type`',
  'SELECT 1 AS skipped');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @number_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'materials' AND COLUMN_NAME = 'issue_number');
SET @sql = IF(@number_exists = 0,
  'ALTER TABLE `materials` ADD COLUMN `issue_number` INT NULL COMMENT ''上传期号'' AFTER `issue_year`',
  'SELECT 1 AS skipped');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'materials' AND INDEX_NAME = 'idx_materials_issue');
SET @sql = IF(@idx_exists = 0,
  'ALTER TABLE `materials` ADD INDEX `idx_materials_issue` (`issue_year`, `issue_number`)',
  'SELECT 1 AS skipped');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @constraint_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'materials' AND CONSTRAINT_NAME = 'chk_materials_issue_pair');
SET @sql = IF(@constraint_exists = 0,
  'ALTER TABLE `materials` ADD CONSTRAINT `chk_materials_issue_pair` CHECK (((`issue_year` IS NULL AND `issue_number` IS NULL) OR (`issue_year` BETWEEN 1000 AND 9999 AND `issue_number` > 0)))',
  'SELECT 1 AS skipped');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
