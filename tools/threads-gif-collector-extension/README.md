# Threads GIF 采集助手

本地 Chrome Manifest V3 扩展。打开 Threads 单帖后点击扩展，即可从当前主帖提取 Giphy GIF/动态 WebP 地址并下载标准 JSON。

## 安装

1. Chrome 打开 `chrome://extensions/`。
2. 开启右上角“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择本目录 `tools/threads-gif-collector-extension`。
5. 将“Threads GIF 采集助手”固定到工具栏。

## 使用

1. 打开 `https://www.threads.com/@用户/post/帖子ID` 单帖页面并等待加载完成。
2. 点击扩展图标。
3. 确认识别的帖子 ID 和动图数量。
4. 点击“下载采集 JSON”。
5. 把 JSON 交给 `$manual-gif-asset-import` 继续下载、转码、审核、去重和发布。

扩展只读取当前主帖容器内 `media*.giphy.com` 的 `.gif`/`.webp` 图片，不读取 Cookie、账号信息、浏览历史，也不向任何服务上传内容。回复、推荐帖子和普通图片不会导出。

## 测试

```powershell
node --test test/extractor.test.cjs
```
