#!/bin/sh

# 启动步数 JSON 的 Node 服务（后台运行）
echo "[$(date)] Starting HTTP API server..."
node /app/server.mjs > /tmp/server.log 2>&1 &

# 启动 MCP WebSocket 服务器（后台运行，连接到小智平台）
echo "[$(date)] Starting MCP WebSocket server..."
node /app/mcp_websocket_server.mjs > /tmp/mcp.log 2>&1 &

# 等待一下，确保服务启动
sleep 2

# 检查进程是否启动
if ps aux | grep -q "[m]cp_websocket_server.mjs"; then
    echo "[$(date)] MCP WebSocket server process started"
else
    echo "[$(date)] ERROR: MCP WebSocket server process not found!"
    echo "[$(date)] Last 20 lines of MCP log:"
    tail -20 /tmp/mcp.log 2>/dev/null || echo "No log file found"
fi

# 启动 nginx（前台运行，保持容器不退出）
echo "[$(date)] Starting nginx..."
nginx -g "daemon off;"



