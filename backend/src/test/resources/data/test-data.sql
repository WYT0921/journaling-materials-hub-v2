-- 测试种子数据（可重复执行：先清空再插入）
DELETE FROM favorites;
DELETE FROM downloads;
DELETE FROM redeem_codes;
DELETE FROM tools;
DELETE FROM materials;
DELETE FROM users;

-- 测试用户
INSERT INTO users (id, openid, nickname, avatar_url, member_type, member_expire_time, points, download_count, status) VALUES
(1, 'test-openid-normal', '测试用户', 'https://example.com/avatar.png', 'normal', NULL, 100, 5, 1),
(2, 'test-openid-premium', '会员用户', 'https://example.com/avatar2.png', 'yearly', '2027-06-11 00:00:00', 500, 20, 1),
(3, 'test-openid-disabled', '禁用用户', NULL, 'normal', NULL, 0, 0, 0);

-- 测试素材（不同分类 + 免费/VIP 混合）
INSERT INTO materials (id, title, description, image_url, thumbnail_url, category, tags, is_premium, download_count, status, sort_order) VALUES
(1, '春日花园贴纸', '清新花园主题', 'https://example.com/img1.png', 'https://example.com/thumb1.png', '贴纸', '["春天","花园"]', 0, 100, 1, 1),
(2, '梦幻星空背景', '星空渐变素材', 'https://example.com/img2.png', 'https://example.com/thumb2.png', '背景纸', '["星空","梦幻"]', 1, 50, 1, 2),
(3, '复古便签纸', '复古做旧便签', 'https://example.com/img3.png', 'https://example.com/thumb3.png', '便签', '["复古"]', 0, 200, 1, 3),
(4, '已下架素材', '不可见的素材', 'https://example.com/img4.png', 'https://example.com/thumb4.png', '贴纸', '[]', 0, 10, 0, 4);

-- 测试兑换码（未使用/已使用/永久）
INSERT INTO redeem_codes (id, code, type, status, user_id, used_time, expire_time) VALUES
(1, 'TEST-VALID-CODE', 'yearly', 0, NULL, NULL, '2027-06-11 00:00:00'),
(2, 'TEST-USED-CODE', 'monthly', 1, 1, '2026-06-10 12:00:00', NULL),
(3, 'TEST-PERMANENT', 'permanent', 0, NULL, NULL, '2099-12-31 00:00:00');
