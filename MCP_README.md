# MCP 步数模拟器服务器

这是一个基于 [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) 的步数模拟器工具服务器，参考了 [mcp-calculator](https://github.com/78/mcp-calculator) 的实现方式。

## 功能特性

MCP 服务器提供了以下工具，供 AI 模型调用：

### 1. `get_steps` - 获取当前步数
获取当前步数数据，包括步数、活动状态和时间戳。

**示例：**
```json
{
  "steps": 1234,
  "status": "WALKING",
  "timestamp": "2025-12-16T08:00:00.000Z"
}
```

### 2. `update_steps` - 更新步数
更新步数数据。可以：
- 直接设置步数值（`steps` 参数）
- 增加或减少步数（`add` 参数，可以是负数）
- 更新活动状态（`status` 参数：IDLE/WALKING/RUNNING）

**参数：**
- `steps` (number, 可选): 直接设置步数值
- `add` (number, 可选): 要增加的步数（可以是负数）
- `status` (string, 可选): 活动状态（IDLE/WALKING/RUNNING）

**示例：**
```json
{
  "add": 100,
  "status": "WALKING"
}
```

### 3. `reset_steps` - 重置步数
将步数重置为 0，状态设置为 IDLE。

### 4. `get_step_status` - 获取步数状态详情
获取完整的步数状态信息，包括：
- 当前步数
- 活动状态
- 时间戳
- 计算的距离（公里）
- 消耗的卡路里（千卡）

**返回示例：**
```json
{
  "steps": 1234,
  "status": "WALKING",
  "timestamp": "2025-12-16T08:00:00.000Z",
  "distance": 0.86,
  "distanceUnit": "km",
  "calories": 49,
  "caloriesUnit": "kcal"
}
```

## 安装与运行

### 1. 安装依赖

```bash
npm install
```

### 2. 直接运行 MCP 服务器（测试）

```bash
npm run mcp-server
```

或

```bash
node mcp_server.mjs
```

MCP 服务器使用 stdio 传输，通过标准输入输出与客户端通信。

## 配置 MCP 客户端

### Claude Desktop 配置

在 Claude Desktop 的配置文件中添加：

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "step-simulator": {
      "command": "node",
      "args": ["/绝对路径/到/SimulatedStep/mcp_server.mjs"],
      "env": {
        "STEP_FILE_PATH": "/绝对路径/到/SimulatedStep/step-data.json"
      }
    }
  }
}
```

### 其他 MCP 客户端

参考项目根目录的 `mcp_config.json` 文件进行配置。

## 数据存储

步数数据存储在 `step-data.json` 文件中（可通过 `STEP_FILE_PATH` 环境变量自定义路径）。

该文件与原有的 HTTP API 服务器（`server.mjs`）共享，因此：
- 通过 MCP 工具更新的步数，会同步到 HTTP API
- 通过 HTTP API 更新的步数，也会被 MCP 工具读取

## 使用示例

### 在 AI 对话中使用

配置好 MCP 服务器后，你可以在 AI 对话中这样使用：

```
用户: 帮我查看当前的步数
AI: [调用 get_steps 工具] 当前步数是 1234 步，状态是行走中。

用户: 增加 500 步
AI: [调用 update_steps 工具，参数: {"add": 500}] 已增加 500 步，当前步数为 1734 步。

用户: 重置步数
AI: [调用 reset_steps 工具] 步数已重置为 0。

用户: 查看步数详情
AI: [调用 get_step_status 工具] 当前步数：1234 步，状态：行走中，距离：0.86 公里，消耗：49 千卡。
```

## 技术实现

- **语言**: Node.js (ES Modules)
- **MCP SDK**: `@modelcontextprotocol/sdk`
- **传输方式**: stdio（标准输入输出）
- **数据格式**: JSON

## 参考资源

- [MCP 官方文档](https://modelcontextprotocol.io/)
- [mcp-calculator 示例项目](https://github.com/78/mcp-calculator)
- [飞书文档 - MCP 使用指南](https://ai.feishu.cn/wiki/HiPEwZ37XiitnwktX13cEM5KnSb)

## 注意事项

1. MCP 服务器使用 stdio 传输，需要通过 MCP 客户端（如 Claude Desktop）调用
2. 步数数据文件路径可以通过 `STEP_FILE_PATH` 环境变量自定义
3. 确保有写入权限，否则更新步数操作会失败
4. 步数不能为负数，如果尝试设置为负数，会自动调整为 0

