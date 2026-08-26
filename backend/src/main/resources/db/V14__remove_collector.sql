-- Collector 已停用：删除运行记录和仅供自动采集使用的审计字段。
DROP TABLE IF EXISTS `collector_runs`;

SET @drop_ai_model = IF(
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'text_assets' AND column_name = 'ai_model'),
  'ALTER TABLE `text_assets` DROP COLUMN `ai_model`', 'SELECT 1'
);
PREPARE collector_cleanup FROM @drop_ai_model;
EXECUTE collector_cleanup;
DEALLOCATE PREPARE collector_cleanup;

SET @drop_ai_confidence = IF(
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'text_assets' AND column_name = 'ai_confidence'),
  'ALTER TABLE `text_assets` DROP COLUMN `ai_confidence`', 'SELECT 1'
);
PREPARE collector_cleanup FROM @drop_ai_confidence;
EXECUTE collector_cleanup;
DEALLOCATE PREPARE collector_cleanup;

SET @drop_review_note = IF(
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'text_assets' AND column_name = 'review_note'),
  'ALTER TABLE `text_assets` DROP COLUMN `review_note`', 'SELECT 1'
);
PREPARE collector_cleanup FROM @drop_review_note;
EXECUTE collector_cleanup;
DEALLOCATE PREPARE collector_cleanup;
