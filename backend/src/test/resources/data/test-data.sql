-- 测试种子数据（可重复执行：先清空再插入）
DELETE FROM feedbacks;
DELETE FROM favorites;
DELETE FROM downloads;
DELETE FROM redeem_codes;
DELETE FROM tools;
DELETE FROM categories;
DELETE FROM materials;
DELETE FROM users;

-- 测试用户
INSERT INTO users (id, openid, nickname, avatar_url, member_type, member_expire_time, points, download_count, status) VALUES
(1, 'test-openid-normal', '测试用户', 'https://example.com/avatar.png', 'normal', NULL, 100, 5, 1),
(2, 'test-openid-premium', '会员用户', 'https://example.com/avatar2.png', 'yearly', '2027-06-11 00:00:00', 500, 20, 1),
(3, 'test-openid-disabled', '禁用用户', NULL, 'normal', NULL, 0, 0, 0),
(4, 'test-openid-free-quota', '免费额度用户', 'https://example.com/avatar4.png', 'normal', NULL, 80, 4, 1);

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

-- 测试分类
INSERT INTO categories (id, name, type, status, sort_order) VALUES
(1, '贴纸', 'material', 1, 1),
(2, '背景纸', 'material', 1, 2),
(3, '写作与项目', 'tool', 1, 1),
(4, '在线设计', 'tool', 1, 2),
(5, '已禁用分类', 'material', 0, 99);

-- 测试默认工具
INSERT INTO tools (id, name, description, icon, url, category, sort_order, is_default, user_id, status) VALUES
(1, 'Notion', '万能笔记工具', '📝', 'https://www.notion.so', '写作与项目', 1, 1, NULL, 1),
(2, 'Canva', '在线设计平台', '🎨', 'https://www.canva.cn', '在线设计', 2, 1, NULL, 1),
(3, '已下架工具', '不可见', '🔧', 'https://example.com', '写作与项目', 99, 1, NULL, 0),
(4, 'Color Hunt', '精选配色方案集合', '🎯', 'https://colorhunt.co', '配色与创意', 3, 1, NULL, 1),
(5, 'Coolors', '快速生成配色方案', '🌈', 'https://coolors.co', '配色与创意', 4, 1, NULL, 1),
(6, 'Google Fonts', '免费开源字体库', '🔤', 'https://fonts.google.com', '字体资源', 5, 1, NULL, 1),
(7, 'DaFont', '英文字体下载站', '✒️', 'https://www.dafont.com', '字体资源', 6, 1, NULL, 1),
(8, 'Freepik', '免费矢量图和PSD素材', '🖼️', 'https://www.freepik.com', '素材资源', 7, 1, NULL, 1),
(9, 'Unsplash', '高质量免费图片', '📷', 'https://unsplash.com', '素材资源', 8, 1, NULL, 1);

-- 测试反馈数据
INSERT INTO feedbacks (id, user_id, content, status) VALUES
(1, 1, '测试反馈：希望增加更多素材', 0),
(2, 2, '会员反馈：下载速度很快', 0),
(3, NULL, '匿名反馈：界面很好看', 1);
