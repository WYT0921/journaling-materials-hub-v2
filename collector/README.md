# Text Asset Collector

一次性采集 CuteInternet 与 EmojiDB 的颜文字/Emoji候选数据。采集结果仅供后台人工审核，不会连接数据库或自动发布。

```bash
npm install
npx playwright install chromium
npm run collect -- --acknowledge-source-terms
```

运行前必须检查目标站点的 robots.txt、使用条款及内容授权。目标 URL、2 秒限速和重试次数在 `config.json` 中配置，域名仅允许 `cuteinternet.com` 与 `emojidb.org`。
