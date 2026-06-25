-- ============================================================
-- V4: 种子数据 — 示例素材 + 测试兑换码
-- ============================================================

-- 示例素材
INSERT INTO materials (title, description, image_url, thumbnail_url, category, tags, is_premium, download_count, status, sort_order) VALUES
('春日花园贴纸套装', '清新春日主题手账贴纸，包含花朵、蝴蝶、小鸟等多种自然元素。高清PNG格式，可直接打印或电子手账使用。', 'https://picsum.photos/seed/s1/800/1000', 'https://picsum.photos/seed/s1/400/500', '贴纸', '["春天","花朵","清新","手绘","自然"]', 0, 234, 1, 1),
('复古牛皮纸便签', '复古做旧风格牛皮纸便签，适合旅行手账，多款可选。', 'https://picsum.photos/seed/s2/800/1200', 'https://picsum.photos/seed/s2/400/600', '便签', '["复古","做旧","旅行"]', 0, 156, 1, 2),
('星空梦幻背景纸', '梦幻星空渐变背景纸，适合创意手账排版，高清大图。', 'https://picsum.photos/seed/s3/800/900', 'https://picsum.photos/seed/s3/400/450', '背景纸', '["星空","渐变","梦幻"]', 1, 89, 1, 3),
('和风樱花胶带', '日式和风樱花主题装饰胶带素材，多层叠加效果。', 'https://picsum.photos/seed/s4/800/1100', 'https://picsum.photos/seed/s4/400/550', '胶带', '["日式","樱花","装饰"]', 1, 312, 1, 4),
('手绘花卉印章', '手绘风格花卉印章素材，细腻笔触，适合贺卡装饰。', 'https://picsum.photos/seed/s5/800/960', 'https://picsum.photos/seed/s5/400/480', '印章', '["手绘","花卉","印章"]', 0, 178, 1, 5),
('简约周计划模板', '极简风格周计划手账模板，可自行打印使用。', 'https://picsum.photos/seed/s6/800/1040', 'https://picsum.photos/seed/s6/400/520', '模板', '["简约","计划","模板"]', 0, 445, 1, 6),
('复古印章合集', '复古邮戳风格印章素材合集，旅行手账必备。', 'https://picsum.photos/seed/s7/800/880', 'https://picsum.photos/seed/s7/400/440', '印章', '["复古","邮戳","合集"]', 1, 67, 1, 7),
('渐变色贴纸包', '莫兰迪渐变色调贴纸包，温柔治愈风格。', 'https://picsum.photos/seed/s8/800/1160', 'https://picsum.photos/seed/s8/400/580', '贴纸', '["渐变","莫兰迪","温柔"]', 0, 198, 1, 8),
('透明底花框便签', '透明底花框便签，PNG格式可直接叠加使用。', 'https://picsum.photos/seed/s9/800/940', 'https://picsum.photos/seed/s9/400/470', '便签', '["透明","花框","叠加"]', 0, 123, 1, 9),
('清新绿叶背景纸', '清新绿叶纹理背景纸，自然气息扑面而来。', 'https://picsum.photos/seed/s10/800/1020', 'https://picsum.photos/seed/s10/400/510', '背景纸', '["绿叶","清新","自然"]', 1, 56, 1, 10),
('和风金箔胶带', '传统和风金箔装饰胶带，华丽精致。', 'https://picsum.photos/seed/s11/800/980', 'https://picsum.photos/seed/s11/400/490', '胶带', '["和风","金箔","华丽"]', 1, 201, 1, 11),
('月计划子弹笔记模板', '子弹笔记风格月计划模板，高效规划每一天。', 'https://picsum.photos/seed/s12/800/1060', 'https://picsum.photos/seed/s12/400/530', '模板', '["子弹笔记","月计划","高效"]', 0, 367, 1, 12);

-- 测试兑换码（预置一批可用兑换码）
INSERT INTO redeem_codes (code, type, status) VALUES
('JOURNAL-VIP-2026', 'yearly', 0),
('JOURNAL-SVIP-001', 'permanent', 0),
('JOURNAL-MONTH-FREE', 'monthly', 0);
