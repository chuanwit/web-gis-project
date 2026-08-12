#!/bin/bash
#=============================================================
# 智慧城市大屏 - 一键部署脚本
# 在服务器上执行: bash deploy.sh
#=============================================================
set -e

echo "=========================================="
echo "  智慧城市大屏 - 部署脚本"
echo "=========================================="

# 0. 检查环境
echo ""
echo "[0/7] 检查环境..."
node -v 2>/dev/null || { echo "ERROR: Node.js 未安装! 请先安装 Node.js 18+"; exit 1; }
nginx -v 2>&1 || { echo "ERROR: Nginx 未安装! 请先安装 Nginx"; exit 1; }
echo "  Node.js: $(node -v)"
echo "  Nginx: $(nginx -v 2>&1)"

# 1. 创建目录
echo ""
echo "[1/7] 创建目录..."
mkdir -p /var/www/smart-city
mkdir -p /opt/smart-city-ai
echo "  /var/www/smart-city  (前端)"
echo "  /opt/smart-city-ai   (AI 服务 + 数据)"

# 2. 解压
echo ""
echo "[2/7] 解压部署包..."
if [ -f /root/deploy.zip ]; then
    cd /root
    rm -rf /tmp/smart-city-deploy
    unzip -o deploy.zip -d /tmp/smart-city-deploy
    # 复制前端到 web 目录
    cp -rf /tmp/smart-city-deploy/dist /var/www/smart-city/
    # 复制 AI 服务到运行目录
    cp -rf /tmp/smart-city-deploy/server /opt/smart-city-ai/
    cp -f /tmp/smart-city-deploy/package.json /opt/smart-city-ai/
    cp -f /tmp/smart-city-deploy/package-lock.json /opt/smart-city-ai/ 2>/dev/null || true
    echo "  前端文件已部署到 /var/www/smart-city/dist"
    echo "  AI 服务已部署到 /opt/smart-city-ai"
else
    echo "ERROR: /root/deploy.zip 不存在!"
    echo "  请先从本地上传 deploy.zip 到服务器 /root/ 目录"
    exit 1
fi

# 3. 复制 mock 数据（生产环境由 Express 提供数据接口）
echo ""
echo "[3/7] 部署 mock 数据..."
# 尝试从解压目录找 mock, 没有则从项目目录找
if [ -d /tmp/smart-city-deploy/mock ]; then
    cp -rf /tmp/smart-city-deploy/mock /opt/smart-city-ai/
elif [ -d /root/smart-city/mock ]; then
    cp -rf /root/smart-city/mock /opt/smart-city-ai/
fi
# 如果还是没有, 从 git 拉取
if [ ! -d /opt/smart-city-ai/mock ]; then
    echo "  mock 数据未在压缩包中, 从 Gitee 拉取..."
    cd /tmp
    git clone --depth 1 https://gitee.com/foodgood661/web-gis-project.git /tmp/smart-city-repo
    cp -rf /tmp/smart-city-repo/mock /opt/smart-city-ai/
    rm -rf /tmp/smart-city-repo
fi
echo "  mock 数据: $(ls /opt/smart-city-ai/mock/*.json 2>/dev/null | wc -l) 个 JSON 文件"

# 4. 安装 AI 服务依赖
echo ""
echo "[4/7] 安装 AI 服务依赖..."
cd /opt/smart-city-ai
npm install express cors --production 2>/dev/null || npm install express cors
echo "  依赖安装完成"

# 5. 配置 Nginx
echo ""
echo "[5/7] 配置 Nginx..."
NGINX_CONF="/etc/nginx/conf.d/smart-city.conf"
if [ -f "$NGINX_CONF" ]; then
    echo "  备份旧配置: $NGINX_CONF.bak"
    cp "$NGINX_CONF" "${NGINX_CONF}.bak"
fi

# 写入 Nginx 配置 (端口 8080, 不占用 80)
cat > "$NGINX_CONF" << 'NGINX_EOF'
server {
    listen 8080;
    server_name 101.37.211.21;

    root /var/www/smart-city/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 所有 API 请求代理到 Express(数据接口 + AI 服务)
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Connection "";
        # SSE 关键: 禁用缓冲
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
        add_header X-Accel-Buffering no;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 1024;
    gzip_comp_level 6;
    client_max_body_size 10m;
}
NGINX_EOF

echo "  Nginx 配置已写入: $NGINX_CONF"
nginx -t
echo "  Nginx 配置测试通过"

# 放行 8080 端口(服务器防火墙, 非阿里云安全组)
if command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-port=8080/tcp 2>/dev/null
    firewall-cmd --reload 2>/dev/null
    echo "  firewalld 已放行 8080/tcp"
elif command -v ufw &> /dev/null; then
    ufw allow 8080/tcp 2>/dev/null
    echo "  ufw 已放行 8080/tcp"
else
    echo "  (提示: 未检测到防火墙, 请确保 8080 端口可访问)"
fi

# 6. 启动/重启服务
echo ""
echo "[6/7] 启动服务..."

# 停止旧的 AI 服务进程
pkill -f "node /opt/smart-city-ai/server/index.js" 2>/dev/null || true
sleep 1

# 安装 pm2（如果未安装）
if ! command -v pm2 &> /dev/null; then
    echo "  安装 PM2 进程管理器..."
    npm install -g pm2
fi

# 用 PM2 启动 AI 服务
cd /opt/smart-city-ai
pm2 delete smart-city-ai 2>/dev/null || true
pm2 start server/index.js --name smart-city-ai
pm2 save
echo "  AI 服务已启动 (PM2: smart-city-ai)"

# 设置 PM2 开机自启
pm2 startup 2>/dev/null || true

# 重载 Nginx
nginx -s reload
echo "  Nginx 已重载"

# 7. 验证
echo ""
echo "[7/7] 验证部署..."
sleep 2

# 检查前端
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/ 2>/dev/null || echo "000")
echo "  前端访问: http://localhost:8080/ → HTTP $HTTP_CODE"

# 检查数据接口
DATA_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/wuhan_events 2>/dev/null || echo "000")
echo "  数据接口: /api/wuhan_events → HTTP $DATA_CODE"

# 检查 AI 服务
AI_HEALTH=$(curl -s http://localhost:3001/api/ai/health 2>/dev/null || echo "fail")
echo "  AI 服务健康: $AI_HEALTH"

# 完成
echo ""
echo "=========================================="
echo "  部署完成!"
echo "=========================================="
echo ""
echo "  访问地址: http://101.37.211.21:8080/"
echo "  AI 健康检查: http://101.37.211.21:8080/api/ai/health"
echo ""
echo "  管理命令:"
echo "    pm2 status              # 查看 AI 服务状态"
echo "    pm2 logs smart-city-ai  # 查看 AI 日志"
echo "    pm2 restart smart-city-ai  # 重启 AI 服务"
echo "    nginx -s reload         # 重载 Nginx"
echo ""
echo "  如需启用 DeepSeek 真实大模型:"
echo "    echo 'DEEPSEEK_API_KEY=sk-你的key' > /opt/smart-city-ai/server/.env"
echo "    pm2 restart smart-city-ai"
echo ""
echo "  *** 重要: 请在阿里云安全组中放行 8080 端口 (TCP) ***"
echo "  控制台 → ECS → 安全组 → 配置规则 → 入方向 → 添加 8080/TCP"
echo ""


