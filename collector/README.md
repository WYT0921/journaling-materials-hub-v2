# 每日文本素材采集器

生产流水线：`CuteInternet / EmojiDB / Threads → 规则过滤 → AI 分类 → 增量去重 → 待审核入库 → 运行报告`。

## 本地命令

```bash
npm install
npx playwright install chromium
npm test
npm run dry-run
npm run run-once
npm run scheduled
```

- `dry-run`：采集并写报告，不连接后端入库。
- `run-once`：手动执行一次生产任务。
- `scheduled`：按 `COLLECTOR_CRON` 等待执行；`COLLECTOR_ENABLED=false` 时仅保持容器运行。

报告保存在 `${COLLECTOR_DATA_DIR:-output}/runs/<run-id>/report.json`。生产部署的挂载路径为 `/data/runs/<run-id>/report.json`。

## 环境变量

| 变量 | 说明 |
|---|---|
| `COLLECTOR_ENABLED` | 是否启用定时调度 |
| `COLLECTOR_CRON` | 每日 Cron，默认 `30 2 * * *` |
| `COLLECTOR_TOKEN` | 后端内部接口令牌，至少 32 字符 |
| `BACKEND_URL` | 后端地址，容器内默认 `http://backend:8080` |
| `APIFY_TOKEN` | Apify API Token |
| `APIFY_ACTOR_ID` | Threads Actor，默认 `magicfingers/threads-scraper` |
| `AI_BASE_URL` | OpenAI 兼容接口根地址 |
| `AI_API_KEY` | AI 接口密钥 |
| `AI_MODEL` | 分类模型名 |

AI 不可用时规则候选仍以待审核状态导入，并记录 `aiFailedCount`。采集器不保存 Threads 用户名或完整帖子/评论，只提交提取后的候选素材和来源 URL。

运行前须确认目标站点、Apify Actor 及 AI 服务的使用条款。生产操作详见 `docs/runbooks/daily-collector.md`。
