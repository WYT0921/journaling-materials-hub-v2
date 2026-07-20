# 免费下载次数配置化设计

## 目标

将后端硬编码的普通用户免费下载次数迁移到 Spring Boot 配置文件，默认值由 5 调整为 50，并允许部署环境通过环境变量覆盖。

## 设计

- 在 `application.yml` 增加 `app.download.free-limit: ${FREE_DOWNLOAD_LIMIT:50}`。
- `DownloadServiceImpl` 使用 `@Value("${app.download.free-limit:50}")` 注入额度，所有额度校验及响应字段统一使用该值。
- 不改变下载接口响应结构；`freeDownloadLimit`、`freeDownloadUsed`、`freeDownloadRemaining` 的字段及含义保持不变。
- 更新服务和控制器测试中的默认额度预期，增加配置覆盖测试，确保配置值确实参与业务判断。

## 验收标准

- 未设置环境变量时，普通用户免费下载额度为 50 次。
- 设置 `FREE_DOWNLOAD_LIMIT` 后，业务校验和响应使用覆盖值。
- 重复下载不重复消耗额度，会员逻辑保持不变。
- 后端相关测试及完整测试通过。
