#!/bin/bash

# MCP 连接状态快速检查脚本
# 使用方法: ./check_mcp.sh [container-name]

CONTAINER_NAME="${1:-stepmaster-admin}"

echo "=========================================="
echo "  MCP 连接状态检查"
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

# 1. 检查 MCP 进程
echo "1️⃣  检查 MCP 进程..."
MCP_PID=$(docker exec $CONTAINER_NAME ps aux 2>/dev/null | grep "[m]cp_websocket_server.mjs" | awk '{print $2}')
if [ -n "$MCP_PID" ]; then
    echo "   ✅ MCP 进程正在运行 (PID: $MCP_PID)"
else
    echo "   ❌ MCP 进程未运行"
    echo ""
    echo "   所有 Node 进程:"
    docker exec $CONTAINER_NAME ps aux 2>/dev/null | grep node || echo "   未找到 Node 进程"
fi
echo ""

# 2. 查看 MCP 日志
echo "2️⃣  查看 MCP 服务器日志..."
echo "   (最近 30 行)"
echo ""
MCP_LOG=$(docker exec $CONTAINER_NAME tail -30 /tmp/mcp.log 2>/dev/null)
if [ -n "$MCP_LOG" ]; then
    echo "$MCP_LOG" | sed 's/^/   /'
else
    echo "   ⚠️  日志文件不存在或为空"
    echo "   尝试查看容器标准输出..."
    docker logs $CONTAINER_NAME --tail 50 2>&1 | grep -i "mcp\|websocket" | tail -10 | sed 's/^/   /' || echo "   未找到相关日志"
fi
echo ""

# 3. 检查连接状态
echo "3️⃣  检查连接状态..."
CONNECTION_LOG=$(docker exec $CONTAINER_NAME tail -50 /tmp/mcp.log 2>/dev/null | grep -iE "connected|initialized|error|failed" | tail -5)
if [ -n "$CONNECTION_LOG" ]; then
    echo "   连接相关日志:"
    echo "$CONNECTION_LOG" | sed 's/^/   /'
    
    if echo "$CONNECTION_LOG" | grep -qiE "connected|initialized"; then
        echo ""
        echo "   ✅ 已找到连接成功的日志"
    elif echo "$CONNECTION_LOG" | grep -qiE "error|failed"; then
        echo ""
        echo "   ❌ 发现错误日志"
    fi
else
    echo "   ⚠️  未找到连接相关日志"
fi
echo ""

# 4. 检查依赖
echo "4️⃣  检查依赖包..."
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

# 5. 检查文件
echo "5️⃣  检查关键文件..."
if docker exec $CONTAINER_NAME test -f /app/mcp_websocket_server.mjs 2>/dev/null; then
    echo "   ✅ mcp_websocket_server.mjs 存在"
else
    echo "   ❌ mcp_websocket_server.mjs 不存在"
fi

if docker exec $CONTAINER_NAME test -x /app/entrypoint.sh 2>/dev/null; then
    echo "   ✅ entrypoint.sh 存在且可执行"
else
    echo "   ❌ entrypoint.sh 不存在或不可执行"
fi
echo ""

# 6. 测试手动启动
echo "6️⃣  测试手动启动（仅检查语法）..."
SYNTAX_CHECK=$(docker exec $CONTAINER_NAME node --check /app/mcp_websocket_server.mjs 2>&1)
if [ $? -eq 0 ]; then
    echo "   ✅ 语法检查通过"
else
    echo "   ❌ 语法错误:"
    echo "$SYNTAX_CHECK" | sed 's/^/   /'
fi
echo ""

# 总结
echo "=========================================="
echo "  诊断建议"
echo "=========================================="
echo ""

if [ -z "$MCP_PID" ]; then
    echo "🔴 MCP 服务器未运行"
    echo ""
    echo "可能的原因："
    echo "  1. 启动脚本执行失败"
    echo "  2. 依赖包缺失"
    echo "  3. 代码错误导致进程退出"
    echo ""
    echo "建议操作："
    echo "  1. 查看完整日志: docker logs $CONTAINER_NAME"
    echo "  2. 查看 MCP 日志: docker exec $CONTAINER_NAME cat /tmp/mcp.log"
    echo "  3. 手动测试: docker exec $CONTAINER_NAME node /app/mcp_websocket_server.mjs"
else
    echo "🟡 MCP 服务器进程存在，但可能未连接"
    echo ""
    echo "建议操作："
    echo "  1. 查看实时日志: docker exec $CONTAINER_NAME tail -f /tmp/mcp.log"
    echo "  2. 检查网络连接: docker exec $CONTAINER_NAME wget -O- https://api.xiaozhi.me"
    echo "  3. 检查 Token 是否有效"
fi

echo ""
echo "=========================================="

