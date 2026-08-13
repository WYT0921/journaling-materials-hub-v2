# AURA Music PWA

移动端优先的 AURA Music Web 原型。照片、草稿和导出文件只在浏览器本地处理，服务端仅提供已发布模板和素材目录。

```bash
npm install
npm run dev
```

开发服务运行在 `http://localhost:5174`，并将 `/api` 代理到 `http://localhost:8080`。首次离线会使用内置 5 个模板。

```bash
npm test
npm run build
npm run preview
```

生产部署需要 HTTPS，构建产物位于 `dist/`。PWA 通过 Manifest 与 Service Worker 提供安装和离线应用壳；iPhone 需在 Safari 分享菜单中选择“添加到主屏幕”。
