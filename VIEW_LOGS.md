# Docker 日志查看指南

## 方法一：在服务器上直接查看（SSH 登录后）

### 1. 查看容器列表

```bash
# 查看所有运行中的容器
docker ps

# 查看所有容器（包括停止的）
docker ps -a
```

### 2. 查看容器日志

```bash
# 查看完整日志
docker logs <容器名或容器ID>

# 查看最近 100 行日志
docker logs <容器名> --tail 100

# 实时跟踪日志（类似 tail -f）
docker logs <容器名> -f

# 查看最近 1 小时的日志
docker logs <容器名> --since 1h

# 查看指定时间段的日志
docker logs <容器名> --since "2025-12-27T14:00:00" --until "2025-12-27T15:00:00"
```

### 3. 过滤 MCP 相关日志

```bash
# 只查看 MCP 相关日志
docker logs <容器名> 2>&1 | grep -i "mcp\|websocket\|xiaozhi"

# 查看最近 50 行，并过滤 MCP 相关
docker logs <容器名> --tail 50 2>&1 | grep -i "mcp\|websocket"

# 实时跟踪 MCP 日志
docker logs <容器名> -f 2>&1 | grep -i "mcp\|websocket"
```

### 4. 查看容器内的日志文件

```bash
# 查看 MCP 服务器日志文件
docker exec <容器名> cat /tmp/mcp.log

# 查看最近 30 行
docker exec <容器名> tail -30 /tmp/mcp.log

# 实时跟踪日志文件
docker exec <容器名> tail -f /tmp/mcp.log

# 查看 HTTP API 服务器日志
docker exec <容器名> cat /tmp/server.log
```

## 方法二：通过云效 Flow 平台查看

### 1. 在流水线运行页面查看

1. 进入云效 Flow 控制台
2. 找到你的项目"模拟步数后台"
3. 点击运行记录（如 #13）
4. 在流水线可视化界面中：
   - 点击"构建镜像"阶段的 **"日志"** 按钮
   - 点击"新阶段"（Kubernetes 发布）阶段的 **"日志"** 按钮

### 2. 查看构建日志

在"构建镜像"阶段的日志中，可以看到：
- Docker 镜像构建过程
- 文件复制情况
- 依赖安装情况

### 3. 查看部署日志

在"Kubernetes 分批发布"阶段的日志中，可以看到：
- 容器启动情况
- 部署状态

## 方法三：通过 Kubernetes 查看（如果使用 K8s）

### 1. 查看 Pod 列表

```bash
# 查看所有 Pod
kubectl get pods

# 查看指定命名空间的 Pod
kubectl get pods -n <namespace>
```

### 2. 查看 Pod 日志

```bash
# 查看 Pod 日志
kubectl logs <pod-name>

# 查看最近 100 行
kubectl logs <pod-name> --tail=100

# 实时跟踪
kubectl logs <pod-name> -f

# 查看指定容器的日志（如果 Pod 有多个容器）
kubectl logs <pod-name> -c <container-name>
```

### 3. 进入 Pod 查看

```bash
# 进入 Pod 的 shell
kubectl exec -it <pod-name> -- sh

# 然后可以查看日志文件
cat /tmp/mcp.log
cat /tmp/server.log
```

## 方法四：使用检查脚本

使用项目中的检查脚本：

```bash
# 下载 check_mcp.sh 到服务器
# 然后运行
./check_mcp.sh <容器名>

# 脚本会自动检查并显示相关日志
```

## 快速诊断命令

### 一键查看所有相关信息

```bash
CONTAINER_NAME="stepmaster-admin"  # 替换为你的容器名

echo "=== 容器状态 ==="
docker ps | grep $CONTAINER_NAME

echo ""
echo "=== 最近 50 行日志 ==="
docker logs $CONTAINER_NAME --tail 50

echo ""
echo "=== MCP 相关日志 ==="
docker logs $CONTAINER_NAME 2>&1 | grep -i "mcp\|websocket" | tail -20

echo ""
echo "=== 进程状态 ==="
docker exec $CONTAINER_NAME ps aux | grep node

echo ""
echo "=== MCP 日志文件 ==="
docker exec $CONTAINER_NAME cat /tmp/mcp.log 2>/dev/null | tail -30 || echo "日志文件不存在"
```

## 常见日志位置

### 容器内日志文件

- `/tmp/mcp.log` - MCP WebSocket 服务器日志
- `/tmp/server.log` - HTTP API 服务器日志
- `/var/log/nginx/access.log` - Nginx 访问日志
- `/var/log/nginx/error.log` - Nginx 错误日志

### 查看这些日志

```bash
# MCP 日志
docker exec <容器名> cat /tmp/mcp.log

# HTTP API 日志
docker exec <容器名> cat /tmp/server.log

# Nginx 访问日志
docker exec <容器名> cat /var/log/nginx/access.log

# Nginx 错误日志
docker exec <容器名> cat /var/log/nginx/error.log
```

## 日志分析技巧

### 查找错误

```bash
# 查找所有错误
docker logs <容器名> 2>&1 | grep -i "error\|failed\|exception"

# 查找连接问题
docker logs <容器名> 2>&1 | grep -i "connect\|connection\|timeout"

# 查找 MCP 相关错误
docker logs <容器名> 2>&1 | grep -i "mcp.*error\|websocket.*error"
```

### 查看启动过程

```bash
# 查看容器启动时的日志
docker logs <容器名> 2>&1 | head -50

# 查看最近的启动日志
docker logs <容器名> 2>&1 | grep -i "starting\|started\|initialized"
```

## 导出日志

```bash
# 导出日志到文件
docker logs <容器名> > container.log 2>&1

# 导出最近 1000 行
docker logs <容器名> --tail 1000 > container.log 2>&1

# 导出 MCP 相关日志
docker logs <容器名> 2>&1 | grep -i "mcp\|websocket" > mcp.log
```

## 注意事项

1. **日志大小限制**：Docker 默认会限制日志大小，如果日志太多可能会被截断
2. **日志轮转**：长时间运行的容器，日志可能会被轮转
3. **权限问题**：某些日志文件可能需要特定权限才能查看
4. **实时查看**：使用 `-f` 参数可以实时查看日志，按 `Ctrl+C` 退出

## 如果找不到容器

```bash
# 查看所有容器（包括停止的）
docker ps -a

# 查看已停止容器的日志
docker logs <容器名或ID>

# 如果容器已删除，日志可能无法恢复
```

