ALTER TABLE `materials`
  ADD COLUMN `media_type` VARCHAR(24) NOT NULL DEFAULT 'static_image' AFTER `material_type`,
  ADD COLUMN `content_hash` CHAR(64) NULL AFTER `thumbnail_url`,
  ADD COLUMN `mime_type` VARCHAR(64) NULL AFTER `content_hash`,
  ADD COLUMN `file_size` BIGINT NULL AFTER `mime_type`,
  ADD COLUMN `width` INT NULL AFTER `file_size`,
  ADD COLUMN `height` INT NULL AFTER `width`,
  ADD COLUMN `duration_ms` INT NULL AFTER `height`,
  ADD COLUMN `frame_count` INT NULL AFTER `duration_ms`,
  ADD COLUMN `source` VARCHAR(32) NULL AFTER `frame_count`,
  ADD COLUMN `source_url` VARCHAR(512) NULL AFTER `source`,
  ADD COLUMN `collected_at` DATETIME NULL AFTER `source_url`;

CREATE UNIQUE INDEX `uk_materials_content_hash` ON `materials` (`content_hash`);
CREATE INDEX `idx_materials_media_type` ON `materials` (`media_type`);
CREATE INDEX `idx_materials_source_url` ON `materials` (`source_url`);
