-- 管理员回复用户反馈
ALTER TABLE `feedbacks`
  ADD COLUMN `reply` TEXT NULL COMMENT '管理员回复' AFTER `status`,
  ADD COLUMN `replied_at` DATETIME NULL COMMENT '回复时间' AFTER `reply`;
