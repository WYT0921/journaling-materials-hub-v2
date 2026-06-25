# 部署指南

本文档详细说明如何部署手账素材小程序。

## 一、环境要求

### 服务器环境
- 操作系统：Linux (推荐 Ubuntu 20.04+ / CentOS 7+)
- Node.js：16.0+
- MySQL：8.0+
- Nginx：1.18+（可选，用于反向代理）

### 开发环境
- 微信开发者工具
- Node.js 16+
- MySQL 8.0+

## 二、后端部署

### 1. 服务器准备

```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y  # Ubuntu
# 或
sudo yum update -y  # CentOS

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs  # Ubuntu
# 或
curl -fsSL https://rpm.nodesource.com/setup_16.x | sudo bash -
sudo yum install -y nodejs  # CentOS

# 验证安装
node --version
npm --version

# 安装 PM2
sudo npm install -g pm2
```

### 2. 安装 MySQL

```bash
# Ubuntu
sudo apt install mysql-server -y
sudo mysql_secure_installation

# CentOS
sudo yum install mysql-server -y
sudo systemctl start mysqld
sudo systemctl enable mysqld
sudo mysql_secure_installation
```

### 3. 配置数据库

```bash
# 登录 MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE journaling_materials_hub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 创建用户（可选）
CREATE USER 'journaling_user'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON journaling_materials_hub.* TO 'journaling_user'@'localhost';
FLUSH PRIVILEGES;

# 退出
EXIT;
```

### 4. 部署后端代码

```bash
# 创建项目目录
sudo mkdir -p /var/www/journaling-materials-hub
sudo chown $USER:$USER /var/www/journaling-materials-hub

# 克隆代码（或上传代码）
cd /var/www/journaling-materials-hub
git clone <repository-url> .
# 或使用 scp 上传
# scp -r ./server user@your-server:/var/www/journaling-materials-hub/

# 进入后端目录
cd server

# 安装依赖
npm install --production

# 配置环境变量
cp .env.example .env
nano .env  # 编辑配置文件
```

### 5. 配置环境变量

编辑 `.env` 文件，配置以下参数：

```bash
# 服务器配置
PORT=3000
NODE_ENV=production

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=journaling_user
DB_PASSWORD=your_strong_password
DB_NAME=journaling_materials_hub

# JWT配置（务必修改为强密码）
JWT_SECRET=your_very_long_and_random_secret_key_here
JWT_EXPIRES_IN=7d

# 微信小程序配置
WECHAT_APPID=your_wechat_appid
WECHAT_SECRET=your_wechat_secret

# 日志配置
LOG_LEVEL=info
```

### 6. 运行数据库迁移

```bash
# 运行迁移
npm run migrate

# 插入种子数据（可选）
npm run seed
```

### 7. 启动服务

```bash
# 使用 PM2 启动
pm2 start src/app.js --name journaling-materials-hub

# 查看状态
pm2 status

# 查看日志
pm2 logs journaling-materials-hub

# 设置开机自启
pm2 startup
pm2 save
```

### 8. 配置 Nginx（可选）

```bash
# 安装 Nginx
sudo apt install nginx -y  # Ubuntu
# 或
sudo yum install nginx -y  # CentOS

# 创建配置文件
sudo nano /etc/nginx/sites-available/journaling-materials-hub
```

配置内容：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL 证书配置
    ssl_certificate /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 日志
    access_log /var/log/nginx/journaling-materials-hub-access.log;
    error_log /var/log/nginx/journaling-materials-hub-error.log;

    # 代理配置
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }

    # 静态文件缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

启用配置：

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/journaling-materials-hub /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

## 三、前端部署

### 1. 配置小程序

1. 打开微信开发者工具
2. 导入 `miniprogram` 目录
3. 配置项目信息：
   - AppID：在微信公众平台获取
   - 项目名称：手账素材小程序

### 2. 修改配置

编辑 `miniprogram/utils/api.js`：

```javascript
const app = getApp();

const request = (url, method = 'GET', data = {}) => {
  return new Promise((resolve, reject) => {
    // 修改为你的后端域名
    const baseUrl = 'https://your-domain.com/api';
    // ...
  });
};
```

### 3. 配置服务器域名

登录[微信公众平台](https://mp.weixin.qq.com/)：

1. 进入 开发 -> 开发管理 -> 开发设置
2. 在 服务器域名 中配置：
   - request合法域名：`https://your-domain.com`
   - uploadFile合法域名：`https://your-domain.com`（如需要）
   - downloadFile合法域名：`https://your-domain.com`（如需要）

### 4. 上传代码

1. 在微信开发者工具中点击"上传"
2. 填写版本号和描述
3. 上传成功后，在微信公众平台提交审核

### 5. 审核与发布

1. 登录微信公众平台
2. 进入 版本管理 -> 审核版本
3. 提交审核（通常需要1-7个工作日）
4. 审核通过后，点击"发布"

## 四、SSL证书配置

### 申请免费SSL证书（Let's Encrypt）

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx -y  # Ubuntu
# 或
sudo yum install certbot python3-certbot-nginx -y  # CentOS

# 申请证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run

# 设置自动续期定时任务
sudo crontab -e
# 添加以下行：
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## 五、域名备案

### 国内服务器必须备案

1. 购买域名（阿里云、腾讯云等）
2. 购买服务器（阿里云ECS、腾讯云CDS等）
3. 在服务器提供商处提交备案申请
4. 准备备案材料：
   - 身份证正反面
   - 域名证书
   - 网站备案信息真实性核验单
5. 等待审核（通常需要1-20个工作日）
6. 备案成功后，配置域名解析

### 配置域名解析

1. 登录域名管理控制台
2. 添加A记录：
   - 主机记录：@
   - 记录类型：A
   - 记录值：服务器IP地址
3. 添加CNAME记录（可选）：
   - 主机记录：www
   - 记录类型：CNAME
   - 记录值：your-domain.com

## 六、监控与维护

### 1. PM2 监控

```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs journaling-materials-hub

# 监控面板
pm2 monit

# 重启应用
pm2 restart journaling-materials-hub

# 停止应用
pm2 stop journaling-materials-hub
```

### 2. 日志管理

```bash
# 查看应用日志
tail -f /var/log/nginx/journaling-materials-hub-access.log
tail -f /var/log/nginx/journaling-materials-hub-error.log

# 查看 PM2 日志
tail -f ~/.pm2/logs/journaling-materials-hub-out.log
tail -f ~/.pm2/logs/journaling-materials-hub-error.log
```

### 3. 数据库备份

```bash
# 创建备份脚本
sudo nano /usr/local/bin/backup-journaling-db.sh
```

脚本内容：

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="journaling_materials_hub"

mkdir -p $BACKUP_DIR

mysqldump -u root -p$DB_PASSWORD $DB_NAME > $BACKUP_DIR/$DB_NAME_$DATE.sql

# 删除7天前的备份
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
```

设置定时任务：

```bash
# 添加执行权限
sudo chmod +x /usr/local/bin/backup-journaling-db.sh

# 编辑定时任务
sudo crontab -e

# 添加以下行（每天凌晨2点备份）
# 0 2 * * * /usr/local/bin/backup-journaling-db.sh
```

### 4. 性能监控

```bash
# 查看系统资源
htop

# 查看磁盘使用
df -h

# 查看内存使用
free -h

# 查看网络连接
netstat -tulpn
```

## 七、常见问题

### 1. 小程序无法连接后端

**可能原因：**
- 域名未备案
- 未配置HTTPS
- 服务器域名未在微信公众平台配置
- 防火墙阻止访问

**解决方案：**
1. 检查域名是否已备案
2. 确保配置了SSL证书
3. 在微信公众平台配置服务器域名
4. 检查防火墙设置：
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   ```

### 2. 数据库连接失败

**可能原因：**
- 数据库服务未启动
- 用户名/密码错误
- 数据库不存在
- 权限不足

**解决方案：**
```bash
# 检查 MySQL 状态
sudo systemctl status mysql

# 启动 MySQL
sudo systemctl start mysql

# 登录测试
mysql -u your_username -p
```

### 3. 图片加载失败

**可能原因：**
- 图片URL配置错误
- 图片服务器未配置HTTPS
- CDN配置问题

**解决方案：**
1. 检查图片URL是否正确
2. 确保图片服务器支持HTTPS
3. 检查CORS配置

### 4. 内存不足

**解决方案：**
```bash
# 查看内存使用
free -h

# 增加swap空间
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 永久生效
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 八、安全建议

### 1. 服务器安全

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 配置防火墙
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 禁用root登录
sudo nano /etc/ssh/sshd_config
# 修改：PermitRootLogin no
sudo systemctl restart sshd
```

### 2. 应用安全

- 使用强密码
- 定期更新依赖
- 限制API访问频率
- 记录访问日志
- 定期备份数据

### 3. 数据安全

- 敏感数据加密存储
- 使用HTTPS传输
- 定期备份数据库
- 限制数据库访问权限

## 九、更新部署

### 代码更新

```bash
# 进入项目目录
cd /var/www/journaling-materials-hub/server

# 拉取最新代码
git pull origin main

# 安装依赖
npm install --production

# 运行迁移（如有）
npm run migrate

# 重启应用
pm2 restart journaling-materials-hub
```

### 数据库更新

```bash
# 运行迁移
npm run migrate

# 如需回滚
npm run migrate:undo
```

## 十、回滚方案

### 代码回滚

```bash
# 查看提交历史
git log --oneline

# 回滚到指定版本
git reset --hard <commit-hash>

# 重启应用
pm2 restart journaling-materials-hub
```

### 数据库回滚

```bash
# 回滚上一次迁移
npm run migrate:undo

# 回滚所有迁移
npm run migrate:undo:all

# 恢复备份
mysql -u root -p journaling_materials_hub < /var/backups/mysql/backup.sql
```
