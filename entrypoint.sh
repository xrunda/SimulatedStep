#!/bin/sh

# 启动步数 JSON 的 Node 服务（后台运行）
node /app/server.mjs &

# 启动 nginx（前台运行，保持容器不退出）
nginx -g "daemon off;"


