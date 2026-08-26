# 小红书素材库长期宣传帖 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 生成一组可长期发布的小红书手账素材库宣传图及配套正文。

**Architecture:** 使用同一简约视觉系统生成六张 3:4 竖版图。每张图各自传达一个信息点，保留足够留白，所有文字均在发布时以小红书正文或后期排版添加，避免生成图片中文字失真。

**Tech Stack:** OpenAI built-in image generation, Markdown copywriting.

## Global Constraints

- 调性为简约、克制、有纸张质感，低饱和米白、浅灰、豆绿配色。
- 画幅为 3:4 竖版，适合小红书图文发布。
- 避免卡通装饰、甜腻配色、密集元素、品牌标识和水印。
- 不出现“微信小程序”或同义平台名称。
- 不出现“会员”“VIP”“支付”等直接交易导向表述。
- 获取信息仅使用“下单后发送专属激活码，输入后解锁素材权限”。

---

### Task 1: 生成六张统一风格宣传图

**Files:**
- Create: `output/xiaohongshu-material-library/01-cover.png`
- Create: `output/xiaohongshu-material-library/02-categories.png`
- Create: `output/xiaohongshu-material-library/03-single-and-sets.png`
- Create: `output/xiaohongshu-material-library/04-use-cases.png`
- Create: `output/xiaohongshu-material-library/05-updates.png`
- Create: `output/xiaohongshu-material-library/06-access-code.png`

**Interfaces:**
- Consumes: `docs/superpowers/specs/2026-07-11-xiaohongshu-material-library-promo-design.md`
- Produces: 六张用于图文发布的 PNG 营销配图。

- [ ] **Step 1: 生成封面图**

使用 3:4 竖版静物构图：米白纸张、浅灰桌面、克制的豆绿色标签纸、手账贴纸与便签局部预览；中心留白用于后期添加“手账素材库”标题；无文字、无人物、无水印。

- [ ] **Step 2: 生成分类图**

使用整齐网格展示贴纸、便签、背景纸、胶带、印章五类纸质素材的抽象实物预览；物品间留白清晰；无文字、无水印。

- [ ] **Step 3: 生成单个与整套图**

左侧为散落但整齐的单个贴纸元素，右侧为一张完整素材纸，体现自由搭配与整套使用；无文字、无水印。

- [ ] **Step 4: 生成使用场景图**

俯拍桌面，展示平板手账页面、纸质日记本与打印素材并置；画面自然克制，屏幕不出现可读 UI 文本；无文字、无水印。

- [ ] **Step 5: 生成持续更新图**

展示按月份归档的简约文件夹、卡纸和逐渐增加的素材小样，表现持续收藏与更新；无文字、无水印。

- [ ] **Step 6: 生成获取方式图**

展示一张简洁通行卡、抽象激活码卡片和已解锁的素材文件夹，保留文案区域；不显示真实代码、不显示平台名称、无文字、无水印。

- [ ] **Step 7: 逐张检查**

确认六张图都为竖版、配色一致、主体完整、无可读错误文字、无平台名称、无水印。

### Task 2: 编写发布正文

**Files:**
- Create: `output/xiaohongshu-material-library/post-copy.md`

**Interfaces:**
- Consumes: 六张最终宣传图。
- Produces: 标题、正文、获取方式与话题标签。

- [ ] **Step 1: 写入标题**

`手账素材库｜让每一页都更有自己的样子`

- [ ] **Step 2: 写入正文**

使用第一人称分享口吻，介绍贴纸、便签、背景纸、胶带、印章，以及单个元素和整套素材两种使用方式；写明适合电子手账、打印手账、日记排版；写明素材持续更新；最后使用“下单后发送专属激活码，输入后解锁素材权限”。

- [ ] **Step 3: 写入标签**

`#手账素材 #电子手账 #手帐素材 #贴纸素材 #手账排版 #手账控 #日记灵感 #数字手账`

- [ ] **Step 4: 文案检查**

确认文案不包含平台名称、“会员”、“VIP”、“支付”、具体价格、数量或更新频率。
