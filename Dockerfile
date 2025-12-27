# 第一阶段：构建应用
FROM registry.cn-beijing.aliyuncs.com/xrunda-public/node:23-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json（如果存在）
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 第二阶段：生产环境
FROM registry.cn-beijing.aliyuncs.com/xrunda-public/node:23-alpine AS production

# 安装 nginx（Alpine Linux）
RUN apk add --no-cache nginx

# 设置工作目录
WORKDIR /app

# 从构建阶段复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 Node 步数服务脚本
COPY server.mjs /app/server.mjs

# 复制 MCP WebSocket 服务器
COPY mcp_websocket_server.mjs /app/mcp_websocket_server.mjs

# 生产环境中，将步数 JSON 写入 nginx 静态目录
ENV STEP_FILE_PATH=/usr/share/nginx/html/step-data.json

# 复制启动脚本（同时启动 Node 服务、MCP 服务器和 nginx）
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# 复制 nginx 配置文件
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 80

# 启动脚本：先启动 Node，再启动 nginx
CMD ["/app/entrypoint.sh"]

