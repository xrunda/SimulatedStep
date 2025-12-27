# MCP 微信步数工具

这是一个基于 [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) 的微信步数查询工具，用于在小智平台获取微信运动步数数据。

## 功能特性

MCP 服务器提供了一个只读工具，用于获取微信步数数据：

### `get_wechat_steps` - 获取微信步数

从微信运动同步的步数信息，包括：
- 今日步数
- 活动状态（IDLE/WALKING/RUNNING）
- 时间戳
- 计算的距离（公里）
- 消耗的卡路里（千卡）

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

## 数据来源

步数数据从 `step-data.json` 文件读取，该文件由微信步数同步服务更新。

## 安装与运行

### 1. 安装依赖

```bash
npm install
```

### 2. 启动 WebSocket MCP 服务器

```bash
npm run mcp-ws
```

或

```bash
node mcp_websocket_server.mjs
```

## 配置

### 环境变量

- `MCP_WS_ENDPOINT`: WebSocket 端点（可选，默认使用代码中的配置）
- `STEP_FILE_PATH`: 步数数据文件路径（可选，默认使用项目根目录）

## 使用示例

### 在小智平台使用

配置好 MCP 服务器后，你可以在小智平台对话中这样使用：

```
用户: 帮我查看今天的微信步数
AI: [调用 get_wechat_steps 工具] 您今天的微信步数是 1234 步，已行走 0.86 公里，消耗 49 千卡。

用户: 我的微信步数是多少？
AI: [调用 get_wechat_steps 工具] 您当前的微信步数是 1234 步。
```

## 技术实现

- **语言**: Node.js (ES Modules)
- **MCP SDK**: `@modelcontextprotocol/sdk`
- **传输方式**: WebSocket
- **数据格式**: JSON

## 注意事项

1. 这是一个**只读**工具，只能查询步数，不能修改
2. 步数数据需要由其他服务（如微信步数同步服务）更新到 `step-data.json` 文件
3. MCP 服务器需要持续运行以保持连接
4. 如果连接断开，服务器会自动尝试重连

## 参考资源

- [MCP 官方文档](https://modelcontextprotocol.io/)
- [小智平台配置指南](./XIAOZHI_SETUP.md)
