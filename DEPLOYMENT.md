# 部署指南

本指南说明如何将步数模拟器应用（包括 MCP WebSocket 服务器）部署到服务器。

## 部署架构

部署后，容器内会同时运行：
1. **Nginx** - 提供前端 Web 应用和静态 JSON API
2. **HTTP API 服务器** (`server.mjs`) - 处理步数更新请求
3. **MCP WebSocket 服务器** (`mcp_websocket_server.mjs`) - 连接到小智平台，注册 MCP 工具

## 部署方式

### 方式一：使用 Docker Compose（推荐）

#### 1. 准备环境变量文件

创建 `.env` 文件（可选）：

```bash
# MCP WebSocket 端点（如果需要自定义）
MCP_WS_ENDPOINT=wss://api.xiaozhi.me/mcp/?token=YOUR_TOKEN

# 步数文件路径（通常不需要修改）
STEP_FILE_PATH=/usr/share/nginx/html/step-data.json
```

#### 2. 构建和启动

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

#### 3. 验证部署

- **Web 应用**: 访问 `http://your-server:8080`
- **步数 JSON API**: 访问 `http://your-server:8080/step-data.json`
- **MCP 服务器**: 查看日志确认已连接到小智平台

```bash
# 查看 MCP 服务器日志
docker-compose logs app | grep -i "mcp\|websocket"
```

### 方式二：使用云效 Flow（阿里云）

#### 1. 配置构建流程

在云效 Flow 中，你的构建流程应该包括：
- 代码拉取
- Docker 镜像构建
- 推送到 ACR（阿里云容器镜像服务）
- 部署到服务器/容器服务

#### 2. 配置环境变量

在部署阶段，如果需要自定义 MCP WebSocket 端点，可以在容器环境变量中设置：

```yaml
environment:
  - MCP_WS_ENDPOINT=wss://api.xiaozhi.me/mcp/?token=YOUR_TOKEN
```

#### 3. 验证部署

部署完成后，检查：
- 容器是否正常运行
- MCP WebSocket 服务器是否成功连接
- 工具是否已注册到小智平台

### 方式三：手动部署

#### 1. 构建 Docker 镜像

```bash
docker build -t stepmaster-admin:latest .
```

#### 2. 运行容器

```bash
docker run -d \
  --name stepmaster-admin \
  -p 8080:80 \
  -e MCP_WS_ENDPOINT=wss://api.xiaozhi.me/mcp/?token=YOUR_TOKEN \
  --restart unless-stopped \
  stepmaster-admin:latest
```

#### 3. 查看日志

```bash
docker logs -f stepmaster-admin
```

## 环境变量配置

### MCP_WS_ENDPOINT

MCP WebSocket 服务器连接端点。如果不设置，将使用代码中的默认值。

```bash
export MCP_WS_ENDPOINT=wss://api.xiaozhi.me/mcp/?token=YOUR_TOKEN
```

### STEP_FILE_PATH

步数数据文件路径。生产环境默认使用 `/usr/share/nginx/html/step-data.json`，通常不需要修改。

## 验证 MCP 工具注册

部署后，可以通过以下方式验证 MCP 工具是否成功注册：

### 1. 查看容器日志

```bash
docker logs stepmaster-admin | grep -i "mcp\|websocket\|tools"
```

应该看到类似输出：
```
WebSocket connected to Xiaozhi platform
MCP server initialized and connected to Xiaozhi platform
Available tools: get_steps, update_steps, reset_steps, get_step_status
```

### 2. 检查连接状态

如果连接成功，日志中应该没有错误信息。如果连接失败，会看到：
- WebSocket 连接错误
- 自动重连尝试

### 3. 在小智平台测试

在小智平台的 AI 对话中，尝试使用工具：
- "查看当前步数"
- "增加 100 步"
- "获取步数详情"

## 故障排查

### MCP 服务器无法连接

1. **检查网络连接**
   ```bash
   # 在容器内测试连接
   docker exec stepmaster-admin wget -O- https://api.xiaozhi.me
   ```

2. **检查 Token 是否有效**
   - Token 可能已过期
   - 更新 `MCP_WS_ENDPOINT` 环境变量

3. **查看详细日志**
   ```bash
   docker logs stepmaster-admin 2>&1 | grep -i error
   ```

### 工具调用失败

1. **检查步数文件权限**
   ```bash
   docker exec stepmaster-admin ls -la /usr/share/nginx/html/step-data.json
   ```

2. **检查文件是否可写**
   ```bash
   docker exec stepmaster-admin touch /usr/share/nginx/html/step-data.json
   ```

### 自动重连问题

如果看到频繁的重连日志：
- 检查服务器网络稳定性
- 检查防火墙设置
- 确认 WebSocket 端点可访问

## 监控和维护

### 监控容器状态

```bash
# 查看容器状态
docker ps | grep stepmaster-admin

# 查看资源使用
docker stats stepmaster-admin
```

### 更新部署

```bash
# 拉取最新代码
git pull

# 重新构建
docker-compose build

# 重启服务
docker-compose up -d
```

### 备份数据

步数数据存储在容器内的 `/usr/share/nginx/html/step-data.json`，建议定期备份：

```bash
# 备份步数数据
docker cp stepmaster-admin:/usr/share/nginx/html/step-data.json ./backup-step-data.json
```

## 生产环境建议

1. **使用进程管理器**
   - 考虑使用 PM2 或 systemd 管理 Node.js 进程
   - 确保服务自动重启

2. **日志管理**
   - 配置日志轮转
   - 使用集中式日志收集（如 ELK）

3. **监控告警**
   - 监控容器健康状态
   - 设置 MCP 连接失败的告警

4. **安全配置**
   - 定期更新 Token
   - 使用 HTTPS/WSS
   - 限制容器资源使用

5. **高可用**
   - 考虑多实例部署
   - 使用负载均衡
   - 配置健康检查

## 相关文件

- `Dockerfile` - Docker 镜像构建配置
- `docker-compose.yml` - Docker Compose 配置
- `entrypoint.sh` - 容器启动脚本
- `mcp_websocket_server.mjs` - MCP WebSocket 服务器
- `XIAOZHI_SETUP.md` - 小智平台配置指南

