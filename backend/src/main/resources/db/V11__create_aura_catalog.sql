CREATE TABLE IF NOT EXISTS `aura_templates` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `template_key` VARCHAR(64) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `style` VARCHAR(32) NOT NULL,
  `preview_url` VARCHAR(512) DEFAULT NULL,
  `supported_ratios` JSON NOT NULL,
  `config_json` JSON NOT NULL,
  `config_version` INT NOT NULL DEFAULT 1,
  `status` TINYINT NOT NULL DEFAULT 0,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_aura_templates_key` (`template_key`),
  KEY `idx_aura_templates_public` (`status`, `sort_order`, `id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `aura_assets` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `asset_key` VARCHAR(64) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `type` VARCHAR(16) NOT NULL,
  `file_url` VARCHAR(512) NOT NULL,
  `preview_url` VARCHAR(512) DEFAULT NULL,
  `sha256` CHAR(64) NOT NULL,
  `resource_version` INT NOT NULL DEFAULT 1,
  `metadata_json` JSON DEFAULT NULL,
  `status` TINYINT NOT NULL DEFAULT 0,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_aura_assets_key` (`asset_key`),
  KEY `idx_aura_assets_public` (`status`, `type`, `sort_order`, `id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `aura_templates`
(`template_key`, `name`, `style`, `supported_ratios`, `config_json`, `config_version`, `status`, `sort_order`) VALUES
('fresh-rounded', '清新圆角', 'fresh', '["1:1","4:3","9:16"]', '{"layers":[{"id":"background-main","type":"background","x":0,"y":0,"width":1,"height":1},{"id":"photo-main","type":"photo","x":0.05,"y":0.42,"width":0.9,"height":0.53},{"id":"player-main","type":"player","x":0.08,"y":0.08,"width":0.84,"height":0.28}]}', 1, 1, 1),
('cute-pink', '可爱粉色', 'cute', '["1:1","4:3","9:16"]', '{"layers":[{"id":"background-main","type":"background","x":0,"y":0,"width":1,"height":1},{"id":"photo-main","type":"photo","x":0.08,"y":0.39,"width":0.84,"height":0.55},{"id":"player-main","type":"player","x":0.1,"y":0.07,"width":0.8,"height":0.25}]}', 1, 1, 2),
('vintage-paper', '复古纸质', 'vintage', '["1:1","4:3","9:16"]', '{"layers":[{"id":"background-main","type":"background","x":0,"y":0,"width":1,"height":1},{"id":"photo-main","type":"photo","x":0.07,"y":0.4,"width":0.86,"height":0.54},{"id":"player-main","type":"player","x":0.09,"y":0.08,"width":0.82,"height":0.25}]}', 1, 1, 3),
('vinyl-record', '黑胶唱片', 'vinyl', '["1:1","4:3","9:16"]', '{"layers":[{"id":"background-main","type":"background","x":0,"y":0,"width":1,"height":1},{"id":"photo-main","type":"photo","x":0.05,"y":0.42,"width":0.9,"height":0.53},{"id":"player-main","type":"player","x":0.1,"y":0.08,"width":0.8,"height":0.27}]}', 1, 1, 4),
('waveform-line', '波形线', 'waveform', '["1:1","4:3","9:16"]', '{"layers":[{"id":"background-main","type":"background","x":0,"y":0,"width":1,"height":1},{"id":"photo-main","type":"photo","x":0.04,"y":0.44,"width":0.92,"height":0.51},{"id":"player-main","type":"player","x":0.07,"y":0.08,"width":0.86,"height":0.28}]}', 1, 1, 5);
