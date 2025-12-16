#!/bin/bash

# Docker 运行脚本
# 使用方法: ./docker-run.sh [tag] [port]

set -e

# 默认参数
IMAGE_NAME="stepmaster-admin"
DEFAULT_TAG="latest"
DEFAULT_PORT="8080"

TAG=${1:-$DEFAULT_TAG}
PORT=${2:-$DEFAULT_PORT}

FULL_IMAGE_NAME="${IMAGE_NAME}:${TAG}"
CONTAINER_NAME="${IMAGE_NAME}"

echo "=========================================="
echo "启动 Docker 容器"
echo "镜像: ${FULL_IMAGE_NAME}"
echo "容器名: ${CONTAINER_NAME}"
echo "端口映射: ${PORT}:80"
echo "=========================================="

# 检查容器是否已存在
if [ "$(docker ps -aq -f name=${CONTAINER_NAME})" ]; then
    echo "发现已存在的容器，正在停止并删除..."
    docker stop ${CONTAINER_NAME} 2>/dev/null || true
    docker rm ${CONTAINER_NAME} 2>/dev/null || true
fi

# 运行容器
docker run -d \
    --name ${CONTAINER_NAME} \
    -p ${PORT}:80 \
    --restart unless-stopped \
    ${FULL_IMAGE_NAME}

echo ""
echo "=========================================="
echo "容器启动成功！"
echo ""
echo "访问地址: http://localhost:${PORT}"
echo ""
echo "查看日志:"
echo "  docker logs -f ${CONTAINER_NAME}"
echo ""
echo "停止容器:"
echo "  docker stop ${CONTAINER_NAME}"
echo ""
echo "删除容器:"
echo "  docker rm ${CONTAINER_NAME}"
echo "=========================================="

