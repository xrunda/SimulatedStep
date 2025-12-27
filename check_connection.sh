#!/bin/bash

# MCP 连接详细检查脚本
# 使用方法: ./check_connection.sh [pod-name 或 container-name]

POD_OR_CONTAINER="${1}"

echo "=========================================="
echo "  MCP 连接详细检查"
echo "=========================================="
echo ""

# 检查是 Pod 还是容器
if kubectl get pod "$POD_OR_CONTAINER" &>/dev/null; then
    echo "检测到 Kubernetes Pod: $POD_OR_CONTAINER"
    echo ""
    
    # 查看 MCP 日志文件
    echo "1️⃣  查看 MCP 服务器日志 (/tmp/mcp.log)..."
    echo ""
    MCP_LOG=$(kubectl exec $POD_OR_CONTAINER -- cat /tmp/mcp.log 2>/dev/null)
    if [ -n "$MCP_LOG" ]; then
        echo "$MCP_LOG" | tail -50
    else
        echo "   ⚠️  日志文件不存在或为空"
        echo "   尝试查看标准输出..."
        kubectl logs $POD_OR_CONTAINER --tail 100 2>&1 | grep -i "mcp\|websocket\|xiaozhi\|error" | tail -20
    fi
    echo ""
    
    # 检查进程
    echo "2️⃣  检查 MCP 进程状态..."
    kubectl exec $POD_OR_CONTAINER -- ps aux | grep -E "mcp|node" | grep -v grep
    echo ""
    
    # 检查网络连接
    echo "3️⃣  测试网络连接..."
    kubectl exec $POD_OR_CONTAINER -- wget -O- https://api.xiaozhi.me 2>&1 | head -5
    echo ""
    
elif docker ps --format '{{.Names}}' | grep -q "^${POD_OR_CONTAINER}$"; then
    echo "检测到 Docker 容器: $POD_OR_CONTAINER"
    echo ""
    
    # 查看 MCP 日志文件
    echo "1️⃣  查看 MCP 服务器日志 (/tmp/mcp.log)..."
    echo ""
    MCP_LOG=$(docker exec $POD_OR_CONTAINER cat /tmp/mcp.log 2>/dev/null)
    if [ -n "$MCP_LOG" ]; then
        echo "$MCP_LOG" | tail -50
    else
        echo "   ⚠️  日志文件不存在或为空"
        echo "   尝试查看标准输出..."
        docker logs $POD_OR_CONTAINER --tail 100 2>&1 | grep -i "mcp\|websocket\|xiaozhi\|error" | tail -20
    fi
    echo ""
    
    # 检查进程
    echo "2️⃣  检查 MCP 进程状态..."
    docker exec $POD_OR_CONTAINER ps aux | grep -E "mcp|node" | grep -v grep
    echo ""
    
    # 检查网络连接
    echo "3️⃣  测试网络连接..."
    docker exec $POD_OR_CONTAINER wget -O- https://api.xiaozhi.me 2>&1 | head -5
    echo ""
else
    echo "❌ 未找到 Pod 或容器: $POD_OR_CONTAINER"
    echo ""
    echo "可用的 Pod:"
    kubectl get pods 2>/dev/null | head -10
    echo ""
    echo "可用的容器:"
    docker ps --format '{{.Names}}' 2>/dev/null | head -10
    exit 1
fi

echo "=========================================="
echo "  关键信息检查"
echo "=========================================="
echo ""

# 查找连接相关日志
echo "查找连接相关日志..."
if kubectl get pod "$POD_OR_CONTAINER" &>/dev/null; then
    CONNECTION_INFO=$(kubectl exec $POD_OR_CONTAINER -- cat /tmp/mcp.log 2>/dev/null | grep -iE "connect|error|failed|initialized|xiaozhi" | tail -10)
else
    CONNECTION_INFO=$(docker exec $POD_OR_CONTAINER cat /tmp/mcp.log 2>/dev/null | grep -iE "connect|error|failed|initialized|xiaozhi" | tail -10)
fi

if [ -n "$CONNECTION_INFO" ]; then
    echo "$CONNECTION_INFO"
else
    echo "   ⚠️  未找到连接相关信息"
fi

echo ""
echo "=========================================="

