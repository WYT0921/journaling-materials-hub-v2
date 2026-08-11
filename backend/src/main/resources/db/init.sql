-- 创建数据库
CREATE DATABASE IF NOT EXISTS journaling_materials_hub
DEFAULT CHARACTER SET utf8mb4
DEFAULT COLLATE utf8mb4_unicode_ci;

USE journaling_materials_hub;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  openid VARCHAR(64) NOT NULL,
  nickname VARCHAR(64) DEFAULT NULL,
  avatar_url VARCHAR(256) DEFAULT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  member_type ENUM('normal', 'monthly', 'yearly', 'permanent') DEFAULT 'normal',
  member_expire_time DATETIME DEFAULT NULL,
  points INT DEFAULT 0,
  download_count INT DEFAULT 0,
  status TINYINT DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE INDEX idx_users_openid (openid),
  INDEX idx_users_member_type (member_type),
  INDEX idx_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 素材表
CREATE TABLE IF NOT EXISTS materials (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(128) NOT NULL,
  description TEXT,
  image_url VARCHAR(256) NOT NULL,
  thumbnail_url VARCHAR(256) DEFAULT NULL,
  category VARCHAR(32) DEFAULT NULL,
  material_type VARCHAR(16) NOT NULL DEFAULT 'single',
  issue_year INT DEFAULT NULL,
  issue_number INT DEFAULT NULL,
  tags JSON DEFAULT NULL,
  is_premium TINYINT(1) DEFAULT 0,
  download_count INT DEFAULT 0,
  status TINYINT DEFAULT 1,
  sort_order INT DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_materials_category (category),
  INDEX idx_materials_material_type (material_type),
  INDEX idx_materials_issue (issue_year, issue_number),
  INDEX idx_materials_is_premium (is_premium),
  INDEX idx_materials_status (status),
  INDEX idx_materials_sort_order (sort_order),
  CONSTRAINT chk_materials_issue_pair CHECK (
    (issue_year IS NULL AND issue_number IS NULL)
    OR (issue_year BETWEEN 1000 AND 9999 AND issue_number > 0)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 兑换码表
CREATE TABLE IF NOT EXISTS redeem_codes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(32) NOT NULL,
  type VARCHAR(16) NOT NULL,
  status TINYINT DEFAULT 0,
  user_id BIGINT DEFAULT NULL,
  used_time DATETIME DEFAULT NULL,
  expire_time DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE INDEX idx_redeem_codes_code (code),
  INDEX idx_redeem_codes_status (status),
  INDEX idx_redeem_codes_user_id (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 下载记录表
CREATE TABLE IF NOT EXISTS downloads (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  material_id BIGINT NOT NULL,
  downloaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_downloads_user_id (user_id),
  INDEX idx_downloads_material_id (material_id),
  INDEX idx_downloads_downloaded_at (downloaded_at),
  UNIQUE INDEX idx_downloads_user_material (user_id, material_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 工具表
CREATE TABLE IF NOT EXISTS tools (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(64) NOT NULL COMMENT '工具名称',
  description VARCHAR(128) DEFAULT NULL COMMENT '工具描述',
  icon VARCHAR(16) DEFAULT NULL COMMENT '图标（emoji）',
  url VARCHAR(256) NOT NULL COMMENT '工具链接',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '排序序号',
  is_default TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否为默认工具',
  user_id BIGINT DEFAULT NULL COMMENT '所属用户（自定义工具用）',
  status TINYINT NOT NULL DEFAULT 1 COMMENT '状态：0=删除 1=正常',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tools_user_id (user_id),
  INDEX idx_tools_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 收藏表
CREATE TABLE IF NOT EXISTS favorites (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL COMMENT '用户 ID',
  material_id BIGINT NOT NULL COMMENT '素材 ID',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
  UNIQUE INDEX idx_favorites_user_material (user_id, material_id),
  INDEX idx_favorites_user_id (user_id),
  INDEX idx_favorites_material_id (material_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 反馈建议表
CREATE TABLE IF NOT EXISTS feedbacks (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT DEFAULT NULL COMMENT '用户 ID，匿名反馈为空',
  content TEXT NOT NULL COMMENT '反馈内容',
  status TINYINT NOT NULL DEFAULT 0 COMMENT '处理状态：0=未处理 1=已处理',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_feedbacks_user_id (user_id),
  INDEX idx_feedbacks_status (status),
  INDEX idx_feedbacks_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS text_assets (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  content TEXT NOT NULL,
  content_hash CHAR(64) NOT NULL,
  type VARCHAR(16) NOT NULL,
  category VARCHAR(32) NOT NULL,
  tags JSON DEFAULT NULL,
  source VARCHAR(32) NOT NULL DEFAULT 'manual',
  source_url VARCHAR(512) DEFAULT NULL,
  risk_level VARCHAR(16) NOT NULL DEFAULT 'safe',
  status TINYINT NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE INDEX uk_text_assets_content_hash (content_hash),
  INDEX idx_text_assets_public (type, status, category, sort_order, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AURA Music Card 声明式模板与远程资源
CREATE TABLE IF NOT EXISTS aura_templates (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  template_key VARCHAR(64) NOT NULL,
  name VARCHAR(100) NOT NULL,
  style VARCHAR(32) NOT NULL,
  preview_url VARCHAR(512) DEFAULT NULL,
  supported_ratios JSON NOT NULL,
  config_json JSON NOT NULL,
  config_version INT NOT NULL DEFAULT 1,
  status TINYINT NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE INDEX uk_aura_templates_key (template_key),
  INDEX idx_aura_templates_public (status, sort_order, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS aura_assets (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  asset_key VARCHAR(64) NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(16) NOT NULL,
  file_url VARCHAR(512) NOT NULL,
  preview_url VARCHAR(512) DEFAULT NULL,
  sha256 CHAR(64) NOT NULL,
  resource_version INT NOT NULL DEFAULT 1,
  metadata_json JSON DEFAULT NULL,
  status TINYINT NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE INDEX uk_aura_assets_key (asset_key),
  INDEX idx_aura_assets_public (status, type, sort_order, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
