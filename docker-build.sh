#!/bin/bash

# Docker 构建和部署脚本
# 使用方法: ./docker-build.sh [tag]

set -e

# 默认镜像标签
IMAGE_NAME="stepmaster-admin"
DEFAULT_TAG="latest"
TAG=${1:-$DEFAULT_TAG}

# 完整镜像名称
FULL_IMAGE_NAME="${IMAGE_NAME}:${TAG}"

echo "=========================================="
echo "开始构建 Docker 镜像"
echo "镜像名称: ${FULL_IMAGE_NAME}"
echo "=========================================="

# 构建镜像
docker build -t ${FULL_IMAGE_NAME} .

echo ""
echo "=========================================="
echo "镜像构建完成: ${FULL_IMAGE_NAME}"
echo "=========================================="

# 显示镜像信息
docker images ${IMAGE_NAME}

echo ""
echo "=========================================="
echo "构建完成！"
echo ""
echo "运行容器:"
echo "  docker run -d -p 8080:80 --name ${IMAGE_NAME} ${FULL_IMAGE_NAME}"
echo ""
echo "查看日志:"
echo "  docker logs -f ${IMAGE_NAME}"
echo ""
echo "停止容器:"
echo "  docker stop ${IMAGE_NAME}"
echo ""
echo "删除容器:"
echo "  docker rm ${IMAGE_NAME}"
echo "=========================================="

