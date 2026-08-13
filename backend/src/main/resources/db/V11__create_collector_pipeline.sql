ALTER TABLE text_assets
  ADD COLUMN ai_model VARCHAR(128) DEFAULT NULL AFTER risk_level,
  ADD COLUMN ai_confidence DECIMAL(5,4) DEFAULT NULL AFTER ai_model,
  ADD COLUMN review_note VARCHAR(512) DEFAULT NULL AFTER ai_confidence;

CREATE TABLE collector_runs (
  id BIGINT NOT NULL AUTO_INCREMENT,
  trigger_type VARCHAR(16) NOT NULL COMMENT 'scheduled / manual / dry-run',
  status VARCHAR(16) NOT NULL COMMENT 'running / succeeded / partial / failed',
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at DATETIME DEFAULT NULL,
  collected_count INT NOT NULL DEFAULT 0,
  candidate_count INT NOT NULL DEFAULT 0,
  filtered_count INT NOT NULL DEFAULT 0,
  duplicate_count INT NOT NULL DEFAULT 0,
  inserted_count INT NOT NULL DEFAULT 0,
  ai_failed_count INT NOT NULL DEFAULT 0,
  source_stats JSON DEFAULT NULL,
  error_summary VARCHAR(1000) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_collector_runs_started (started_at),
  KEY idx_collector_runs_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
