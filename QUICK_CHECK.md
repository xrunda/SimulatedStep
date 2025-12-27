# 快速查看 MCP 连接日志

## 方法一：通过 kubectl 查看日志文件（推荐）

```bash
# 查看 MCP 日志文件
kubectl exec step-simulator-5cd7c7c768-fcri -c step-simulator -- cat /tmp/mcp.log

# 查看最近 50 行
kubectl exec step-simulator-5cd7c7c768-fcri -c step-simulator -- tail -50 /tmp/mcp.log

# 实时跟踪日志
kubectl exec step-simulator-5cd7c7c768-fcri -c step-simulator -- tail -f /tmp/mcp.log
```

## 方法二：在阿里云控制台查看

由于日志被重定向到文件，控制台可能看不到。可以：

1. **通过"容器组"页面进入容器**
   - 点击"容器组"标签
   - 找到对应的 Pod
   - 点击"终端"或"执行命令"
   - 执行：`cat /tmp/mcp.log`

2. **或者等待下次部署**
   - 我已经修改了启动脚本，下次部署后日志会同时输出到控制台

## 方法三：检查进程和连接状态

```bash
# 检查进程是否运行
kubectl exec step-simulator-5cd7c7c768-fcri -c step-simulator -- ps aux | grep mcp

# 检查网络连接
kubectl exec step-simulator-5cd7c7c768-fcri -c step-simulator -- wget -O- https://api.xiaozhi.me 2>&1 | head -5
```

## 期望看到的日志

如果连接成功，应该看到：
```
Connecting to Xiaozhi platform...
WebSocket connected to Xiaozhi platform
MCP server initialized and connected to Xiaozhi platform
Available tool: get_wechat_steps (获取微信步数)
```

如果连接失败，可能看到：
```
WebSocket error: ...
Failed to connect...
Error: ...
```

