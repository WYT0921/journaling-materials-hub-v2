# 运行阶段 — JAR 已在本地预构建，无需 Maven
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# 安装字体（用于图片处理）
RUN apk add --no-cache ttf-dejavu curl

# 复制预构建的 JAR
COPY journaling-materials-hub-1.0.0.jar app.jar

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "-Xmx512m", "-Xms256m", "app.jar"]
