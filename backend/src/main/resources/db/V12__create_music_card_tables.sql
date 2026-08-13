-- Phase 3: 氛围音乐卡片生成器
CREATE TABLE IF NOT EXISTS music_player_templates (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '模板名称',
  description VARCHAR(256) DEFAULT NULL,
  cover_size DECIMAL(3,2) NOT NULL DEFAULT 0.40,
  show_progress TINYINT NOT NULL DEFAULT 1,
  show_controls TINYINT NOT NULL DEFAULT 1,
  show_waveform TINYINT NOT NULL DEFAULT 0,
  show_vinyl TINYINT NOT NULL DEFAULT 0,
  album_art_border_radius INT NOT NULL DEFAULT 16,
  font_family VARCHAR(32) NOT NULL DEFAULT 'sans-serif',
  title_size INT NOT NULL DEFAULT 26,
  artist_size INT NOT NULL DEFAULT 18,
  padding DECIMAL(4,3) NOT NULL DEFAULT 0.060,
  colors JSON NOT NULL COMMENT '播放器颜色配置',
  status TINYINT NOT NULL DEFAULT 1 COMMENT '0停用 1启用',
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_mpt_status (status, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 播放器模板种子数据（与前端 JSON 对齐）
INSERT INTO music_player_templates (name, description, cover_size, show_progress, show_controls, show_waveform, show_vinyl, album_art_border_radius, font_family, title_size, artist_size, padding, colors, sort_order) VALUES
('极简', 'Spotify / Apple Music 风格', 0.40, 1, 1, 0, 0, 16, 'sans-serif', 26, 20, 0.060, '{"background":"transparent","text":"auto","progress":"auto","control":"auto"}', 1),
('复古纸', '撕纸质感，黑白按钮', 0.35, 1, 1, 0, 0, 4, 'serif', 24, 18, 0.080, '{"background":"#f5f0e8","text":"#2c2416","progress":"#2c2416","control":"#2c2416"}', 2),
('韩系粉色', '粉色系 + waveform 波形', 0.38, 0, 1, 1, 0, 20, 'sans-serif', 24, 18, 0.070, '{"background":"transparent","text":"#704f58","waveform":"auto","control":"auto"}', 3),
('黑胶唱片', '复古唱片机风格', 0.50, 0, 0, 0, 1, 999, 'serif', 28, 20, 0.060, '{"background":"#1a1a1a","text":"#e8d5b0","vinyl":"#1a1a1a","label":"#c4a265"}', 4),
('毛玻璃', 'iOS Glassmorphism 风格', 0.35, 1, 1, 0, 0, 12, 'sans-serif', 26, 18, 0.080, '{"background":"transparent","text":"#ffffff","progress":"rgba(255,255,255,0.6)","control":"rgba(255,255,255,0.9)","glass":"rgba(255,255,255,0.15)"}', 5);

CREATE TABLE IF NOT EXISTS music_card_assets (
  id BIGINT NOT NULL AUTO_INCREMENT,
  type VARCHAR(32) NOT NULL COMMENT 'sticker / texture / tape / doodle / background',
  name VARCHAR(100) NOT NULL,
  category VARCHAR(32) DEFAULT NULL COMMENT 'shape / weather / cute / handdraw / tape',
  preview_url VARCHAR(512) DEFAULT NULL,
  config JSON DEFAULT NULL COMMENT '装饰绘制参数',
  tags JSON DEFAULT NULL,
  status TINYINT NOT NULL DEFAULT 1 COMMENT '0停用 1启用',
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_mca_type (type, status),
  KEY idx_mca_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 装饰素材种子数据
INSERT INTO music_card_assets (type, name, category, config, sort_order) VALUES
('sticker', '星星', 'shape', '{"type":"star","defaultCount":8,"defaultSize":20}', 1),
('sticker', '爱心', 'shape', '{"type":"heart","defaultCount":6,"defaultSize":22}', 2),
('sticker', '花朵', 'shape', '{"type":"flower","defaultCount":5,"defaultSize":24}', 3),
('sticker', '菱形', 'shape', '{"type":"diamond","defaultCount":6,"defaultSize":16}', 4),
('sticker', '闪光', 'shape', '{"type":"sparkle","defaultCount":12,"defaultSize":14}', 5),
('sticker', '雨滴', 'weather', '{"type":"rain","defaultCount":30,"defaultSize":12}', 10),
('sticker', '云朵', 'weather', '{"type":"cloud","defaultCount":3,"defaultSize":60}', 11),
('sticker', '雪花', 'weather', '{"type":"snow","defaultCount":20,"defaultSize":10}', 12),
('sticker', '蝴蝶', 'cute', '{"type":"butterfly","defaultCount":4,"defaultSize":28}', 20),
('sticker', '丝带', 'cute', '{"type":"ribbon","defaultCount":3,"defaultSize":40}', 21),
('sticker', '气泡', 'cute', '{"type":"bubble","defaultCount":10,"defaultSize":18}', 22),
('doodle', '手绘圈', 'handdraw', '{"type":"circle","defaultCount":5,"defaultSize":30}', 30),
('doodle', '手绘线', 'handdraw', '{"type":"line","defaultCount":4,"defaultSize":60}', 31),
('doodle', '下划线', 'handdraw', '{"type":"underline","defaultCount":3,"defaultSize":80}', 32),
('tape', '纸胶带', 'tape', '{"type":"tape","defaultCount":3,"defaultSize":60}', 40);

CREATE TABLE IF NOT EXISTS user_music_cards (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  title VARCHAR(128) DEFAULT NULL,
  canvas_snapshot JSON NOT NULL COMMENT '场景完整快照 JSON',
  export_url VARCHAR(512) DEFAULT NULL COMMENT '导出的 PNG URL',
  status TINYINT NOT NULL DEFAULT 1 COMMENT '0删除 1正常',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_umc_user (user_id, status, created_at),
  CONSTRAINT fk_umc_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
