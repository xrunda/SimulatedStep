# MCP 服务验证指南

## 验证方法

### 方法一：查看容器日志（最直接）

SSH 到服务器或通过云效平台查看容器日志：

```bash
# 查看容器日志，过滤 MCP 相关输出
docker logs <container-name> 2>&1 | grep -i "mcp\|websocket\|xiaozhi\|tools"

# 或者查看完整日志
docker logs <container-name> -f
```

**成功标志：**
应该看到类似以下输出：
```
Starting MCP WebSocket server...
WebSocket connected to Xiaozhi platform
MCP server initialized and connected to Xiaozhi platform
Available tools: get_steps, update_steps, reset_steps, get_step_status
```

**失败标志：**
如果看到以下内容，说明连接失败：
```
WebSocket error: ...
Failed to connect...
```

### 方法二：检查进程是否运行

```bash
# 进入容器
docker exec -it <container-name> sh

# 检查 Node.js 进程
ps aux | grep node

# 应该看到至少两个 node 进程：
# 1. node /app/server.mjs (HTTP API 服务器)
# 2. node /app/mcp_websocket_server.mjs (MCP WebSocket 服务器)
```

### 方法三：在小智平台测试工具调用

这是最直接的验证方式：

1. **打开小智平台**（https://ai.feishu.cn 或你的小智平台地址）

2. **在对话中测试工具**：
   - "帮我查看当前步数"
   - "增加 100 步"
   - "获取步数详情"
   - "重置步数"

3. **验证结果**：
   - 如果工具能正常调用并返回数据，说明 MCP 注册成功
   - 如果提示"工具不存在"或"连接失败"，说明 MCP 未成功注册

### 方法四：检查网络连接

```bash
# 在容器内测试 WebSocket 连接
docker exec <container-name> wget -O- https://api.xiaozhi.me

# 或者使用 curl 测试
docker exec <container-name> curl -I https://api.xiaozhi.me
```

### 方法五：验证工具数据同步

1. **通过 Web 界面更新步数**：
   - 访问 https://step-simulator.dev.xrunda.com
   - 手动增加一些步数

2. **通过 MCP 工具查询**：
   - 在小智平台调用 `get_steps` 工具
   - 检查返回的步数是否与 Web 界面一致

3. **通过 MCP 工具更新**：
   - 在小智平台调用 `update_steps` 工具增加步数
   - 刷新 Web 界面，检查步数是否更新

## 常见问题排查

### 问题 1：日志中没有 MCP 相关输出

**可能原因：**
- MCP 服务器启动失败
- 依赖包未正确安装

**解决方法：**
```bash
# 检查容器内是否有 node_modules
docker exec <container-name> ls -la /app/node_modules | head

# 检查 MCP 服务器文件是否存在
docker exec <container-name> ls -la /app/mcp_websocket_server.mjs

# 手动测试运行 MCP 服务器
docker exec <container-name> node /app/mcp_websocket_server.mjs
```

### 问题 2：WebSocket 连接失败

**可能原因：**
- Token 过期
- 网络问题
- 防火墙阻止

**解决方法：**
```bash
# 检查环境变量
docker exec <container-name> env | grep MCP_WS_ENDPOINT

# 更新 Token（如果需要）
docker exec -e MCP_WS_ENDPOINT="wss://api.xiaozhi.me/mcp/?token=NEW_TOKEN" <container-name> node /app/mcp_websocket_server.mjs
```

### 问题 3：工具调用返回错误

**可能原因：**
- 步数文件权限问题
- 文件路径不正确

**解决方法：**
```bash
# 检查步数文件
docker exec <container-name> ls -la /usr/share/nginx/html/step-data.json

# 检查文件内容
docker exec <container-name> cat /usr/share/nginx/html/step-data.json

# 测试文件写入权限
docker exec <container-name> touch /usr/share/nginx/html/step-data.json
```

## 快速验证脚本

创建一个验证脚本 `verify_mcp.sh`：

```bash
#!/bin/bash

CONTAINER_NAME="stepmaster-admin"  # 替换为你的容器名

echo "=== 验证 MCP 服务状态 ==="
echo ""

echo "1. 检查容器状态..."
docker ps | grep $CONTAINER_NAME

echo ""
echo "2. 检查 MCP 相关进程..."
docker exec $CONTAINER_NAME ps aux | grep -E "mcp|websocket" || echo "未找到 MCP 进程"

echo ""
echo "3. 检查最近日志（MCP 相关）..."
docker logs $CONTAINER_NAME --tail 50 2>&1 | grep -i "mcp\|websocket\|xiaozhi\|tools" || echo "未找到 MCP 日志"

echo ""
echo "4. 检查步数文件..."
docker exec $CONTAINER_NAME cat /usr/share/nginx/html/step-data.json 2>/dev/null || echo "无法读取步数文件"

echo ""
echo "=== 验证完成 ==="
```

运行验证脚本：
```bash
chmod +x verify_mcp.sh
./verify_mcp.sh
```

## 成功标准

MCP 服务成功注册的标志：

✅ **容器日志显示：**
- "WebSocket connected to Xiaozhi platform"
- "MCP server initialized and connected to Xiaozhi platform"
- "Available tools: get_steps, update_steps, reset_steps, get_step_status"

✅ **进程运行：**
- `node /app/mcp_websocket_server.mjs` 进程存在

✅ **工具可用：**
- 在小智平台可以成功调用工具
- 工具返回正确的数据

✅ **数据同步：**
- Web 界面和 MCP 工具的数据一致

## 下一步

验证成功后，你可以：
1. 在小智平台使用这些工具进行步数管理
2. 通过工具调用更新步数，Web 界面会自动同步
3. 通过 Web 界面更新步数，工具查询也会返回最新数据

