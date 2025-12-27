#!/bin/sh

# 启动步数 JSON 的 Node 服务（后台运行，同时输出到日志文件和标准输出）
echo "[$(date)] Starting HTTP API server..."
node /app/server.mjs 2>&1 | tee /tmp/server.log &

# 启动 MCP WebSocket 服务器（后台运行，同时输出到日志文件和标准输出）
echo "[$(date)] Starting MCP WebSocket server..."
echo "[$(date)] This will connect to Xiaozhi platform..."
node /app/mcp_websocket_server.mjs 2>&1 | tee /tmp/mcp.log &

# 等待一下，确保服务启动
sleep 3

# 检查进程是否启动
if ps aux | grep -q "[m]cp_websocket_server.mjs"; then
    echo "[$(date)] ✅ MCP WebSocket server process started"
    echo "[$(date)] Checking connection status..."
    sleep 2
    # 显示最近的连接日志
    if [ -f /tmp/mcp.log ]; then
        echo "[$(date)] Recent MCP log:"
        tail -10 /tmp/mcp.log | sed 's/^/  /'
    fi
else
    echo "[$(date)] ❌ ERROR: MCP WebSocket server process not found!"
    echo "[$(date)] Last 20 lines of MCP log:"
    tail -20 /tmp/mcp.log 2>/dev/null | sed 's/^/  /' || echo "  No log file found"
fi

# 启动 nginx（前台运行，保持容器不退出）
echo "[$(date)] Starting nginx..."
nginx -g "daemon off;"



