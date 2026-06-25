## <font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">背景层</font>
### **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">整体背景配色参考：</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">小程序内部的背景改成这种淡粉绿渐变 + 星星的梦幻风格。</font>**
**<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">这种星星渐变背景好温柔！我来看看现有的小程序布局结构，然后把它改成这种梦幻粉绿渐变背景。</font>**

**<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">整个小程序的背景已经从死板的纯白变成参考图里那种梦幻淡粉绿渐变 + 飘浮星星了！来看看这波改动：</font>**

+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">渐变底色</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">：从淡粉（</font>**`**<font style="color:rgb(45, 48, 61);background-color:rgba(88, 82, 82, 0.1);">#fef5f8</font>**`**<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">）→ 淡绿（</font>**`**<font style="color:rgb(45, 48, 61);background-color:rgba(88, 82, 82, 0.1);">#f5fdf5</font>**`**<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">）→ 米白（</font>**`**<font style="color:rgb(45, 48, 61);background-color:rgba(88, 82, 82, 0.1);">#fff8f0</font>**`**<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">），柔和梦幻</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">12 颗星星</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">：淡粉星（</font>**`**<font style="color:rgb(45, 48, 61);background-color:rgba(88, 82, 82, 0.1);">#E8C4D4</font>**`**<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">）和淡绿星（</font>**`**<font style="color:rgb(45, 48, 61);background-color:rgba(88, 82, 82, 0.1);">#C8E6C9</font>**`**<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">）交替散布，每颗都有独立的</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);"> </font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">float 浮动动画</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">（微微上下飘 + 旋转）</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">星星在不同位置、不同大小、不同延迟开始浮动，所以不会齐刷刷动，很自然</font>**

---

### <font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">毛玻璃效果</font>
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">顶部状态栏</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">：</font>**`**<font style="color:rgb(45, 48, 61);background-color:rgba(88, 82, 82, 0.1);">bg-white/70</font>**`**<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);"> </font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">+</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);"> </font>**`**<font style="color:rgb(45, 48, 61);background-color:rgba(88, 82, 82, 0.1);">backdrop-blur-md</font>**`**<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">，背景渐变能透出来</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">底部 TabBar</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">：</font>**`**<font style="color:rgb(45, 48, 61);background-color:rgba(88, 82, 82, 0.1);">bg-white/60</font>**`**<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);"> </font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">+</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);"> </font>**`**<font style="color:rgb(45, 48, 61);background-color:rgba(88, 82, 82, 0.1);">backdrop-blur-md</font>**`**<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">， floating 在梦幻背景上</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">首页 Header</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">：</font>**`**<font style="color:rgb(45, 48, 61);background-color:rgba(88, 82, 82, 0.1);">bg-white/70</font>**`**<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);"> </font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">+ 模糊，搜索框也改成半透明白</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">各页面顶部导航栏</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">（会员中心、兑换页、素材详情页）：统一的毛玻璃风格</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">素材详情页底部 CTA 栏</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">：也是毛玻璃</font>**

---

### <font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">卡片半透明</font>
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">素材卡片</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">：</font>**`**<font style="color:rgb(45, 48, 61);background-color:rgba(88, 82, 82, 0.1);">bg-white/90</font>**`**<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);"> </font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">+</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);"> </font>**`**<font style="color:rgb(45, 48, 61);background-color:rgba(88, 82, 82, 0.1);">backdrop-blur-sm</font>**`**<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">，边缘的渐变微微透出来</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">工具卡片</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">：同样半透明白，配置面板里的输入框也是半透明</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">个人中心卡片</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">：EntryCard、StatsRow 都改成半透明白</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">空状态图标</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">：也从灰底改成半透明白</font>**

---

### <font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">整体效果</font>
**<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">所有页面现在打开都是淡淡的粉绿渐变背景，星星在微微飘，卡片像浮在上面一样。没有了原来那种死白的「网页感」，更像一个可爱的手账小程序了。</font>**

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/48515615/1781145282279-a8920318-10ca-4d8d-915c-922ba061ae42.png)

## <font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">首页</font>
### <font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">桌面预览容器</font>
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">中间一台居中的极简手机外壳（390 × 844，圆角 44px，灵动岛 + 状态栏 + Home Indicator 都还原了）</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">周围是 #F2F2F2 的安静画布，上下还加了顶部标签和底部”桌面预览·居中手机框架”小说明</font>**

### <font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">首页 Feed（黑白灰极简）</font>
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">顶部”发现 · Discover”标题 + 通知按钮</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">胶囊型搜索框</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">（圆角 100px，#F7F7F7 底，13px 字号），右侧筛选 icon 按钮</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">横向滑动 Chips</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">：选中态是黑底白字反显、未选态是 1px 极淡边框，完全按文档的”单焦点呼吸感”</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">两列瀑布流</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">：算法自动平衡左右两列高度；每张卡片 1px #EEEEEE 极淡边框、无阴影；VIP 素材左上角带黑底白字 VIP 角标；底部到底了的横线分隔</font>**

### <font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">底部 Tab 导航</font>
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">三个 Tab：首页 / 工具 / 我的，瞬时切换无横向滑屏动效（符合 Uber 干练风范）</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">选中态黑色加粗、未选态浅灰  
  
</font>**<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/48515615/1781144589862-5abd3adc-0ced-438d-b83f-af4f86016409.png)



## <font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">Phase 2 完成！素材详情页</font>
### <font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">素材详情页（现在点首页任何素材卡都能进去）：</font>
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">顶部极简导航栏：返回按钮 + 分享/更多按钮</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">核心大图区</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">：素材原图全宽展示，保留设计文档中的”大图留白比例”</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">VIP 专属素材在非会员状态下会显示</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">顶部黑底”会员专属”角标</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);"> </font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">+</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);"> </font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">底部渐变遮罩提示”查看高清原图需加入会员”</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">信息区：分类标签、标题、作者信息、点赞/下载数据</font>**

### <font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">底部 CTA 区分两种状态：</font>
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">免费素材 → 唯一的”下载素材”黑色主按钮</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">VIP 素材（非会员）→ 左侧”预览”边框按钮 + 右侧”解锁下载”黑色按钮（设计文档要求的双 CTA 并列）</font>**

### <font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">Unlock Premium 拦截弹窗：</font>
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">点击”解锁下载”或”预览”时，底部顺滑升起半屏弹窗</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">顶部小把手条 + 黑底皇冠 icon + 标题”解锁会员”</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">两个按钮：全黑填充”解锁会员”（点击跳转兑换页） + 纯文本”取消”（无边框极端对比）</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">严格遵守文档：零敏感价格词，零”立即购买”等文案</font>**

### <font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">Toast 提示：非会员下载后会有”已保存至相册”的底部黑底白字微型 Toast，2 秒自动消失</font>
<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/48515615/1781144979388-49a974ef-896d-40b8-acf2-81a5f5a0eab6.png)



<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/48515615/1781144935687-735596f9-e5d3-435e-b7a9-720061976b21.png)



<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/48515615/1781144946795-e01f89a6-d8f7-4439-b313-d24f8c1d7400.png)



## <font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">Phase 3 完成 工具页面</font>
### <font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">页面结构</font>
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">顶部标题「创作工具箱」+ 一行引导文案，干净清爽</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">一根 1px #EEEEEE 分割线切出信息层级</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">下方</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);"> </font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">2 列网格</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);"> </font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">排布 8 个工具卡片，间距呼吸感恰到好处</font>**

### <font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">工具卡片（纯线框极简）</font>
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">圆形淡灰底 + 线性图标，完全按 Uber 黑白灰体系</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">标题 + 两行描述，字号克制（13px/11px）</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">底部「复制链接」胶囊按钮 — 1px 极淡边框，点按反灰过渡</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">零阴影、零装饰，只有信息和功能</font>**

### <font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">复制链接 Toast</font>
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">点任意工具的「复制链接」，底部升起黑底白字圆胶囊 Toast：「链接已复制」</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">带绿勾小图标，2 秒自动消失</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">用 </font>**`**<font style="color:rgb(45, 48, 61);background-color:rgba(88, 82, 82, 0.1);">navigator.clipboard</font>**`**<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);"> 真写剪贴板，复制失败还会提示「复制失败，请重试」</font>**

### <font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">添加工具流程</font>
**<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">1. 点底部「添加新工具」</font>**

+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">底部滑起半屏弹窗，带小把手条</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">顶部「添加工具」标题 + 关闭按钮</font>**

**<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">2. 表单填写</font>**

+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">工具名称</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);"> </font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">→ 比如”我的配色助手”</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">描述</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);"> </font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">→ 一句话说明作用</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">图标</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);"> </font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">→ 点下拉展开 24 个图标网格，选中的变黑底白字，其他灰底</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">工具链接</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);"> </font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">→ 支持</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);"> </font>**`**<font style="color:rgb(45, 48, 61);background-color:rgba(88, 82, 82, 0.1);">/tools/xxx</font>**`**<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);"> </font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">或</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);"> </font>**`**<font style="color:rgb(45, 48, 61);background-color:rgba(88, 82, 82, 0.1);">https://</font>**`**<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);"> </font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">完整链接</font>**

**<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">3. 点「添加工具」</font>**

+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">校验必填项，有错提示红字</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">成功添加后 Toast 提示”工具已添加”</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">弹窗自动关闭，新工具出现在列表里</font>**

---

### <font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">自定义工具展示</font>
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">和默认工具一样用 2 列网格</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">中间有</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);"> </font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">「自定义工具」</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);"> </font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">分隔线区分</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">自定义工具卡片</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">右上角有个小叉</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">，点一下直接删除</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">删除后 Toast 提示”工具已删除”</font>**

---

### <font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">数据持久化</font>
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">自定义工具存在</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);"> </font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">localStorage</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);"> </font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">里</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">刷新页面后自定义工具还在</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">默认工具永远固定，只有自定义的能删能改</font>**

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/48515615/1781145141831-350b4f97-2165-4ae9-8378-f272a645b581.png)

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/48515615/1781145172970-8c147608-f575-4138-a04c-31040c88d00b.png)

## <font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">Phase 4 完成 </font><font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">✅</font><font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);"> 我的</font>
### <font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">「我的」页面（切到 Account Tab 就能看到）</font>
### <font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">顶部身份区</font>
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">圆形头像位（灰底默认 avatar）+ 昵称「手账控Mori」</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">身份徽章：普通用户是灰底灰字「普通用户」，会员是黑底白字 + 皇冠 icon「会员」</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">一气呵成干净利落，信息密度控制得刚好</font>**

### <font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">数据统计条</font>
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">三列均分：下载 47 / 收藏 23 / 素材 128</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">每列小圆标 + 数字 + 标签，用 1px 极淡分隔线切开</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">数字用</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);"> </font>**`**<font style="color:rgb(45, 48, 61);background-color:rgba(88, 82, 82, 0.1);">tabular-nums</font>**`**<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);"> </font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">等宽，不会因为数字不同而左右跳动</font>**

### <font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">双入口卡片</font>
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">第一张「会员中心」— 非会员状态下用</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);"> </font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">黑底白字反显</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">，视觉权重突出，引诱点击：「解锁高清素材 + 全部工具」</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">第二张「兑换会员」— 标准白卡灰框，「使用兑换码激活会员权益」</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">两张都带右侧小箭头，点击即跳</font>**

### <font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">底部设置列表</font>
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">设置 / 素材管理 / 关于 / 反馈建议，四项带圆标 + 箭头</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">点按反馈灰底过渡，符合 Uber 干练风</font>**

---

### <font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">会员中心页（</font>`<font style="color:rgb(45, 48, 61);background-color:rgba(88, 82, 82, 0.1);">/premium</font>`<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">）</font>
**<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">未开通状态</font>**

+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">顶部大圆形灰底 + 皇冠线性 icon</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">标题「解锁会员权益」+ 副文案</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">4 条权益列表：全量高清素材 / 全部工具开放 / 优先更新 / 专属标识 — 每条都带圆标 + 1px 底部分割线</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">底部黑色全宽大按钮「前往兑换」，指向</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);"> </font>**`**<font style="color:rgb(45, 48, 61);background-color:rgba(88, 82, 82, 0.1);">/redeem</font>**`
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">底下一行小字「使用兑换码激活会员，无需付费」— 符合设计文档「零价格敏感词」</font>**

**<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">已开通状态</font>**

+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">黑色圆形底 + 白色皇冠填充 icon，和未开通形成正负形对比</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">「已开通会员」+ 有效期展示</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">2×2 网格权益卡片，每条带白色小圆标</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">底部边框按钮「续费 / 升级」</font>**

---

**<font style="color:rgb(45, 48, 61);background-color:rgb(245, 245, 245);">💡</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(245, 245, 245);"> 想预览已开通状态？在控制台不重要——你可以先看看现在的未开通状态，已经很有说服力了。已开通的视觉会在 Phase 5 兑换成功后自动切过去。</font>**

### <font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">兑换码输入页（</font>`<font style="color:rgb(45, 48, 61);background-color:rgba(88, 82, 82, 0.1);">/redeem</font>`<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">）</font>
**<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">顶部导航</font>**

+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">返回按钮 + 标题「兑换会员」，和会员中心页统一风格</font>**

**<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">输入区域</font>**

+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">大圆形票据 icon + 标题「输入兑换码」+ 副文案</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">输入框带灰底背景，聚焦时切白底 + 黑边框，视觉反馈很脆</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">自动格式化：输入时自动按</font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);"> </font>**`**<font style="color:rgb(45, 48, 61);background-color:rgba(88, 82, 82, 0.1);">XXXX-XXXX-XXXX</font>**`**<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);"> </font>****<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">分段，粘贴也能正常处理</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">输入框右侧带「清除」小圆叉，一键清空</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">最少 8 位校验，不足时红字提示</font>**

**<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">底部按钮</font>**

+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">黑色全宽按钮「立即兑换」，带票据 icon</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">提交时按钮变「验证中…」+ 旋转 loader，防重复点击</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">底部小字说明「区分大小写，支持字母数字组合」</font>**

---

### <font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">兑换结果页（</font>`<font style="color:rgb(45, 48, 61);background-color:rgba(88, 82, 82, 0.1);">/redeem/result</font>`<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">）</font>
**<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">成功态</font>**

+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">大圆形浅灰底 + 黑色对勾 icon（40px），仪式感拉满</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">「兑换成功」大标题 + 「会员权益已激活，感谢你的支持」</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">信息卡片展示三行：兑换码 / 会员类型（年卡）/ 有效期至</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">底部「前往会员中心」黑按钮 + 「返回首页」白边框按钮</font>**

**<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">失败态</font>**

+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">浅红底 + 红色叉号 icon，和成功态形成正负对比</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">「兑换失败」+ 根据原因显示不同错误文案</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">提示卡片列出三种可能原因：输入有误 / 已过期 / 已被使用</font>**
+ **<font style="color:rgb(45, 48, 61);background-color:rgb(244, 244, 245);">底部「重新输入」黑按钮 + 「返回首页」白边框按钮</font>**

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/48515615/1781145208374-cebee52b-7855-4001-b7de-843ed702bbcb.png)

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/48515615/1781145230725-98e92117-fbc2-4e5e-895f-53fbea76a650.png)

## 
