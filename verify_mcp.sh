#!/bin/bash

# MCP 服务验证脚本
# 使用方法: ./verify_mcp.sh [container-name]

CONTAINER_NAME="${1:-stepmaster-admin}"

echo "=========================================="
echo "  MCP 服务验证工具"
echo "=========================================="
echo ""

# 检查容器是否存在
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ 错误: 容器 '$CONTAINER_NAME' 未运行"
    echo ""
    echo "正在运行的容器:"
    docker ps --format '{{.Names}}'
    exit 1
fi

echo "✅ 容器 '$CONTAINER_NAME' 正在运行"
echo ""

# 1. 检查 MCP 相关进程
echo "1️⃣  检查 MCP 进程..."
MCP_PROCESS=$(docker exec $CONTAINER_NAME ps aux 2>/dev/null | grep -E "mcp_websocket_server" | grep -v grep)
if [ -n "$MCP_PROCESS" ]; then
    echo "   ✅ MCP WebSocket 服务器进程正在运行"
    echo "   $MCP_PROCESS" | head -1
else
    echo "   ❌ 未找到 MCP WebSocket 服务器进程"
fi
echo ""

# 2. 检查最近的 MCP 日志
echo "2️⃣  检查 MCP 连接日志（最近 50 行）..."
MCP_LOGS=$(docker logs $CONTAINER_NAME --tail 100 2>&1 | grep -iE "mcp|websocket|xiaozhi|tools|connected|initialized" | tail -10)
if [ -n "$MCP_LOGS" ]; then
    echo "   ✅ 找到 MCP 相关日志:"
    echo "$MCP_LOGS" | sed 's/^/   /'
    
    # 检查是否连接成功
    if echo "$MCP_LOGS" | grep -qiE "connected|initialized"; then
        echo ""
        echo "   ✅ MCP 服务器已成功连接到小智平台"
    else
        echo ""
        echo "   ⚠️  未找到连接成功的日志，可能正在连接中..."
    fi
else
    echo "   ❌ 未找到 MCP 相关日志"
fi
echo ""

# 3. 检查步数文件
echo "3️⃣  检查步数数据文件..."
STEP_FILE="/usr/share/nginx/html/step-data.json"
STEP_DATA=$(docker exec $CONTAINER_NAME cat $STEP_FILE 2>/dev/null)
if [ -n "$STEP_DATA" ]; then
    echo "   ✅ 步数文件存在且可读"
    echo "   当前数据:"
    echo "$STEP_DATA" | python3 -m json.tool 2>/dev/null || echo "$STEP_DATA" | sed 's/^/   /'
else
    echo "   ❌ 无法读取步数文件"
fi
echo ""

# 4. 检查依赖包
echo "4️⃣  检查 MCP 依赖包..."
if docker exec $CONTAINER_NAME test -d /app/node_modules/@modelcontextprotocol 2>/dev/null; then
    echo "   ✅ MCP SDK 已安装"
else
    echo "   ❌ MCP SDK 未找到"
fi

if docker exec $CONTAINER_NAME test -d /app/node_modules/ws 2>/dev/null; then
    echo "   ✅ WebSocket 库已安装"
else
    echo "   ❌ WebSocket 库未找到"
fi
echo ""

# 5. 检查环境变量
echo "5️⃣  检查环境变量..."
ENV_VARS=$(docker exec $CONTAINER_NAME env 2>/dev/null | grep -E "MCP|STEP_FILE" || echo "")
if [ -n "$ENV_VARS" ]; then
    echo "   环境变量:"
    echo "$ENV_VARS" | sed 's/^/   /'
else
    echo "   使用默认配置"
fi
echo ""

# 6. 测试 HTTP API
echo "6️⃣  测试 HTTP API..."
HTTP_RESPONSE=$(curl -s https://step-simulator.dev.xrunda.com/step-data.json 2>/dev/null)
if [ -n "$HTTP_RESPONSE" ]; then
    echo "   ✅ HTTP API 正常"
    echo "   当前步数: $(echo $HTTP_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['steps'])" 2>/dev/null || echo 'N/A')"
else
    echo "   ❌ HTTP API 无响应"
fi
echo ""

# 总结
echo "=========================================="
echo "  验证总结"
echo "=========================================="
echo ""
echo "📋 验证步骤："
echo "   1. 查看容器日志确认连接状态"
echo "   2. 在小智平台测试工具调用"
echo "   3. 验证数据同步（Web ↔ MCP）"
echo ""
echo "🔍 查看完整日志:"
echo "   docker logs $CONTAINER_NAME -f | grep -i mcp"
echo ""
echo "🧪 在小智平台测试:"
echo "   尝试说: '帮我查看当前步数'"
echo "   或: '增加 100 步'"
echo ""
echo "=========================================="

