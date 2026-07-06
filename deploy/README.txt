========================================
  手账素材小程序 — 服务器部署包
========================================

## 目录结构

deploy/
├── docker-compose.yml          # Docker 编排文件（一键启动所有服务）
├── .env.example                # 环境变量模板 → 复制为 .env 并填入真实值
├── README.txt                  # 本文件
├── backend/
│   ├── Dockerfile              # 后端镜像（预构建 JAR，无需 Maven）
│   └── journaling-materials-hub-1.0.0.jar
├── admin-frontend/
│   └── dist/                   # 管理后台静态文件（已构建）
├── nginx/
│   ├── nginx.conf              # Nginx 主配置
│   ├── conf.d/
│   │   └── default.conf        # 站点配置（API 代理 + 静态文件）
│   └── ssl/                    # SSL 证书目录（部署后放入证书）
└── db/
    └── init.sql                # 数据库初始化脚本

## 部署步骤

### 1. 上传到服务器

scp -r deploy/ user@你的服务器IP:/opt/journaling-hub/
# 或通过 git、rsync 等方式上传

### 2. 配置环境变量

cd /opt/journaling-hub
cp .env.example .env
nano .env    # 填入真实配置值

### 3. 启动所有服务

docker compose up -d --build

### 4. 验证

curl http://localhost:8080/actuator/health    # 后端健康检查
curl http://localhost/api/v2/materials         # API 测试
curl http://localhost/                          # 管理后台页面

### 5. 配置 SSL 证书（Let's Encrypt 免费证书）

sudo apt install certbot -y
docker compose stop nginx
sudo certbot certonly --standalone -d 你的域名.com
sudo cp /etc/letsencrypt/live/你的域名.com/fullchain.pem ./nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/你的域名.com/privkey.pem ./nginx/ssl/key.pem
# 然后取消 nginx/conf.d/default.conf 中 HTTPS server 块的注释
docker compose restart nginx

### 6. 设置证书自动续期（每月 1 号）

crontab -e
# 添加：
0 2 1 * * certbot renew --quiet --pre-hook "cd /opt/journaling-hub && docker compose stop nginx" --post-hook "cp /etc/letsencrypt/live/你的域名.com/fullchain.pem /opt/journaling-hub/nginx/ssl/cert.pem && cp /etc/letsencrypt/live/你的域名.com/privkey.pem /opt/journaling-hub/nginx/ssl/key.pem && cd /opt/journaling-hub && docker compose start nginx"

## 小程序相关提醒

1. 小程序 API 地址：确保 frontend/.env.production 中 VITE_API_BASE_URL 指向你的域名
2. 微信公众平台：开发 → 服务器域名 → 配置 request/uploadFile/downloadFile 合法域名
3. 域名必须备案且支持 HTTPS
