#!/bin/sh

# 启动步数 JSON 的 Node 服务（后台运行）
node /app/server.mjs &

# 启动 MCP WebSocket 服务器（后台运行，连接到小智平台）
if [ -n "$MCP_WS_ENDPOINT" ]; then
  echo "Starting MCP WebSocket server with custom endpoint..."
  node /app/mcp_websocket_server.mjs &
else
  echo "Starting MCP WebSocket server with default endpoint..."
  node /app/mcp_websocket_server.mjs &
fi

# 启动 nginx（前台运行，保持容器不退出）
nginx -g "daemon off;"



