CREATE TABLE IF NOT EXISTS material_categories (
  material_id BIGINT NOT NULL,
  category VARCHAR(32) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (material_id, category),
  KEY idx_material_categories_category (category),
  CONSTRAINT fk_material_categories_material FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
);

INSERT IGNORE INTO material_categories (material_id, category, sort_order)
SELECT id, category, 0 FROM materials WHERE category IS NOT NULL AND category <> '';
