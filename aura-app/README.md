# AURA Music

AURA Music 是独立的 Flutter 手机 App，用照片与手动填写的音乐信息生成音乐卡片。用户原图、草稿、作品 JSON、预览与导出图均只保存在设备本地；服务器只提供模板、字体、装饰和纹理目录。

## MVP 能力

- 首页、五步创作流程、模板浏览三栏导航
- 相册/相机取图、丢失选择数据恢复、设备端 5 色提取
- 歌曲、歌手、专辑、文案、时长与可选封面录入
- 5 个内置模板与 1:1、4:3、9:16 三种比例
- 照片缩放/焦点、背景、主题色、字体和装饰密度轻量调整
- 预览与导出共用同一套 Painter，输出精确尺寸的无水印 PNG
- SQLite 自动保存、按作品 ID 分目录、本地草稿恢复与删除
- ETag 目录缓存、SHA-256 资源校验、离线内置模板及远程字体失败回退
- 保存至系统相册与系统分享面板

## 运行

需要 Flutter stable、Android SDK（Android 8.0/API 26+）或 macOS + Xcode（iOS 15+）。

```bash
flutter pub get
flutter run --dart-define=AURA_API_BASE_URL=https://your-api.example.com
```

Android 模拟器调试的默认 API 地址为 `http://10.0.2.2:8080`。真机或生产包必须用 `AURA_API_BASE_URL` 指定可访问的 HTTPS 后端。

```bash
flutter test
flutter build apk --release --dart-define=AURA_API_BASE_URL=https://your-api.example.com
flutter build ios --release --dart-define=AURA_API_BASE_URL=https://your-api.example.com
```

## 数据边界

App 不包含账号、AI、音乐平台搜索/播放、云作品、分析追踪或社区能力，也不会向服务端上传用户照片与作品。远程模板是受限 JSON，不能携带可执行代码。
