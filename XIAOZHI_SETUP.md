# 小智平台 MCP 工具注册指南

本指南说明如何将步数模拟器 MCP 工具注册到小智平台。

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动 WebSocket MCP 服务器

```bash
npm run mcp-ws
```

或者直接运行：

```bash
node mcp_websocket_server.mjs
```

### 3. 配置环境变量（可选）

如果需要自定义步数文件路径：

```bash
export STEP_FILE_PATH=/path/to/step-data.json
```

如果需要使用不同的 WebSocket 端点：

```bash
export MCP_WS_ENDPOINT=wss://api.xiaozhi.me/mcp/?token=YOUR_TOKEN
```

## 当前配置

默认的 WebSocket 端点已配置为：
```
wss://api.xiaozhi.me/mcp/?token=eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 注册的工具

服务器启动后，会自动注册以下工具到小智平台：

1. **get_wechat_steps** - 获取微信步数数据（只读）
   - 返回今日微信步数、活动状态、时间戳
   - 自动计算距离（公里）和消耗的卡路里（千卡）
   - 数据来源：从微信运动同步的步数信息

## 工具使用示例

### 获取微信步数
```json
{
  "tool": "get_wechat_steps",
  "arguments": {}
}
```

**返回示例：**
```json
{
  "steps": 1234,
  "status": "WALKING",
  "timestamp": "2025-12-27T06:13:52.127Z",
  "distance": 0.86,
  "distanceUnit": "km",
  "calories": 49,
  "caloriesUnit": "kcal",
  "source": "wechat"
}
```

**在小智平台使用：**
- "帮我查看今天的微信步数"
- "我的微信步数是多少？"
- "查看微信步数详情"

## 数据存储

步数数据存储在 `step-data.json` 文件中，与原有的 HTTP API 服务器共享数据。

## 故障排查

### 连接失败
- 检查网络连接
- 确认 WebSocket 端点 URL 和 token 是否正确
- 查看控制台错误信息

### 工具调用失败
- 确认服务器正在运行
- 检查 `step-data.json` 文件权限
- 查看服务器日志

### 自动重连
如果连接断开，服务器会自动尝试重连（每 5 秒一次）。

## 注意事项

1. 确保服务器持续运行，否则工具将不可用
2. Token 有过期时间，过期后需要更新
3. 步数数据文件需要有写入权限
4. 服务器会自动处理重连，无需手动干预

