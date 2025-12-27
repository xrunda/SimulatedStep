# MCP 连接问题排查指南

## 问题：小智后台显示"未连接"

### 快速排查步骤

#### 1. 检查容器日志

```bash
# 查看容器名称
docker ps | grep stepmaster

# 查看完整日志（查找 MCP 相关）
docker logs <容器名> 2>&1 | grep -i "mcp\|websocket\|xiaozhi\|error\|failed"

# 查看最近 100 行日志
docker logs <容器名> --tail 100
```

**期望看到的日志：**
```
Starting MCP WebSocket server...
WebSocket connected to Xiaozhi platform
MCP server initialized and connected to Xiaozhi platform
Available tool: get_wechat_steps (获取微信步数)
```

**如果看到错误：**
- `WebSocket error` - 网络连接问题
- `Failed to connect` - 连接失败
- `Module not found` - 依赖包缺失
- 没有任何 MCP 相关日志 - MCP 服务器可能没有启动

#### 2. 检查 MCP 进程是否运行

```bash
# 进入容器
docker exec -it <容器名> sh

# 检查进程
ps aux | grep node

# 应该看到两个进程：
# 1. node /app/server.mjs
# 2. node /app/mcp_websocket_server.mjs
```

如果看不到 `mcp_websocket_server.mjs` 进程，说明 MCP 服务器没有启动。

#### 3. 手动测试 MCP 服务器

```bash
# 进入容器
docker exec -it <容器名> sh

# 手动运行 MCP 服务器（查看错误信息）
node /app/mcp_websocket_server.mjs
```

#### 4. 检查依赖包

```bash
# 检查 node_modules 是否存在
docker exec <容器名> ls -la /app/node_modules | head

# 检查 MCP SDK
docker exec <容器名> test -d /app/node_modules/@modelcontextprotocol && echo "MCP SDK 存在" || echo "MCP SDK 不存在"

# 检查 WebSocket 库
docker exec <容器名> test -d /app/node_modules/ws && echo "WebSocket 库存在" || echo "WebSocket 库不存在"
```

#### 5. 检查网络连接

```bash
# 测试能否访问小智 API
docker exec <容器名> wget -O- https://api.xiaozhi.me 2>&1 | head

# 或者使用 curl
docker exec <容器名> curl -I https://api.xiaozhi.me
```

#### 6. 检查环境变量

```bash
# 查看环境变量
docker exec <容器名> env | grep -E "MCP|STEP_FILE"
```

## 常见问题及解决方案

### 问题 1: MCP 服务器没有启动

**症状：** 日志中没有 MCP 相关输出，进程列表中没有 `mcp_websocket_server.mjs`

**可能原因：**
- `entrypoint.sh` 脚本执行失败
- 文件权限问题
- 启动脚本错误

**解决方案：**
```bash
# 检查启动脚本
docker exec <容器名> cat /app/entrypoint.sh

# 检查文件是否存在
docker exec <容器名> ls -la /app/mcp_websocket_server.mjs

# 手动执行启动脚本中的命令
docker exec <容器名> node /app/mcp_websocket_server.mjs &
```

### 问题 2: 依赖包缺失

**症状：** 日志显示 `Cannot find module '@modelcontextprotocol/sdk'` 或类似错误

**解决方案：**
检查 Dockerfile 是否正确复制了 node_modules：
```bash
# 查看 Dockerfile 中是否有这行：
# COPY --from=builder /app/node_modules /app/node_modules
```

如果没有，需要重新构建镜像。

### 问题 3: WebSocket 连接失败

**症状：** 日志显示 `WebSocket error` 或连接超时

**可能原因：**
- Token 过期或无效
- 网络防火墙阻止
- WebSocket 端点 URL 错误

**解决方案：**
```bash
# 检查环境变量中的端点
docker exec <容器名> env | grep MCP_WS_ENDPOINT

# 如果没有设置，使用默认值（代码中的）
# 检查代码中的默认端点是否正确
```

### 问题 4: 权限问题

**症状：** 无法写入步数文件或读取文件

**解决方案：**
```bash
# 检查文件权限
docker exec <容器名> ls -la /usr/share/nginx/html/step-data.json

# 修复权限（如果需要）
docker exec <容器名> chmod 666 /usr/share/nginx/html/step-data.json
```

## 调试命令汇总

```bash
# 一键检查脚本
CONTAINER_NAME="stepmaster-admin"  # 替换为你的容器名

echo "=== 检查容器状态 ==="
docker ps | grep $CONTAINER_NAME

echo ""
echo "=== 检查进程 ==="
docker exec $CONTAINER_NAME ps aux | grep node

echo ""
echo "=== 检查 MCP 日志 ==="
docker logs $CONTAINER_NAME 2>&1 | grep -i "mcp\|websocket" | tail -20

echo ""
echo "=== 检查依赖 ==="
docker exec $CONTAINER_NAME test -d /app/node_modules/@modelcontextprotocol && echo "✅ MCP SDK" || echo "❌ MCP SDK 缺失"
docker exec $CONTAINER_NAME test -d /app/node_modules/ws && echo "✅ WebSocket" || echo "❌ WebSocket 缺失"

echo ""
echo "=== 检查文件 ==="
docker exec $CONTAINER_NAME ls -la /app/mcp_websocket_server.mjs
docker exec $CONTAINER_NAME ls -la /app/entrypoint.sh
```

## 重新部署建议

如果以上方法都无法解决，可以尝试：

1. **重新构建镜像**
   ```bash
   docker-compose build --no-cache
   docker-compose up -d
   ```

2. **检查最新代码**
   确保 `mcp_websocket_server.mjs` 和 `entrypoint.sh` 已正确提交到代码仓库

3. **查看构建日志**
   在云效 Flow 中查看构建日志，确认所有文件都已正确复制

4. **联系支持**
   如果问题持续，提供以下信息：
   - 容器日志
   - 进程列表
   - Dockerfile 内容
   - entrypoint.sh 内容

