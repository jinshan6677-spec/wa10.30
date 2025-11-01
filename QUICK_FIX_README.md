# ⚡ 快速修复：WhatsApp 连接慢问题

## 🎯 一句话总结

**问题**: 扫码后需要很久才能连接（15-45秒+）
**原因**:
1. Evolution API 使用了过时的 WhatsApp 版本参数
2. **Pre-key 上传超时**（主要原因）⚠️⚠️⚠️
3. WebSocket 未完全建立就发送请求

**修复**: 运行 `restart-evolution-api.bat` (Windows) 或 `restart-evolution-api.sh` (Linux/Mac)

---

## 🚀 快速修复步骤（3分钟）

### Windows 用户

```cmd
# 1. 双击运行脚本
restart-evolution-api.bat

# 2. 等待完成（约1分钟）

# 3. 启动应用并扫码测试
npm start
```

### Linux/Mac 用户

```bash
# 1. 添加执行权限并运行
chmod +x restart-evolution-api.sh
./restart-evolution-api.sh

# 2. 启动应用并扫码测试
npm start
```

---

## ✅ 预期改善

| 之前 | 之后 |
|-----|-----|
| 总连接时间 15-45秒 | 总连接时间 6-12秒 ⚡⚡⚡ |
| Pre-key 上传经常超时 | Pre-key 上传成功 ⚡⚡ |
| Stream error 515 频繁 | Stream error 515 显著减少 ⚡ |
| 已连接时重启仍慢 | 已连接时 <0.2秒 ⚡⚡⚡ |

---

## 🔧 修复内容

### 1. Docker 配置（docker-compose.yml）

```yaml
# 关键修复 1：设置正确的 WhatsApp 版本号
CONFIG_SESSION_PHONE_VERSION: "2.3000.1023204200"

# 关键修复 2：增加 Pre-key 上传超时（解决 408 timeout）
PREKEYS_UPLOAD_TIMEOUT: 120000  # 从默认 30s 增加到 120s

# 关键修复 3：增加 Socket 初始化超时（解决 stream error 515）
SOCKET_INIT_TIMEOUT: 30000

# 关键修复 4：启用错误日志
LOG_BAILEYS: "error"

# 性能优化参数
CONNECTION_TIMEOUT_MS: 60000
MAX_RECONNECTION_ATTEMPTS: 5
RECONNECTION_INTERVAL_MS: 2000
```

### 2. 应用代码（useEvolutionAPI.ts）

```typescript
// 在 WebSocket 连接后添加 2 秒等待，确保完全建立
await new Promise(resolve => setTimeout(resolve, 2000));
```

**参考**:
- [GitHub Issue #1014](https://github.com/EvolutionAPI/evolution-api/issues/1014) - 版本号问题
- [Baileys Issue #313](https://github.com/WhiskeySockets/Baileys/issues/313) - Stream error 515

---

## ❗ 重要提示

1. **会清除旧连接**: 脚本会清理旧数据，需要重新扫码
2. **需要 Docker**: 确保 Docker Desktop 正在运行
3. **等待启动**: 服务启动需要 10-15 秒

---

## 📖 详细文档

完整的问题分析和故障排除，请查看：
👉 [docs/CONNECTION_PERFORMANCE_FIX.md](docs/CONNECTION_PERFORMANCE_FIX.md)

---

## 🆘 仍然有问题？

### 步骤 1: 运行诊断工具

```cmd
diagnose-connection.bat
```

查看输出，重点关注：
- ❌ Pre-key upload timeout
- ❌ stream error 515
- ✅ CONFIG_SESSION_PHONE_VERSION: 2.3000.1023204200

### 步骤 2: 查看详细日志

```bash
docker logs evolution-api --tail 50
```

### 步骤 3: 确认配置生效

```bash
docker inspect evolution-api --format='{{range .Config.Env}}{{println .}}{{end}}' | grep -E "PREKEYS|SOCKET_INIT"
```

应该看到：
```
PREKEYS_UPLOAD_TIMEOUT=120000
SOCKET_INIT_TIMEOUT=30000
```

### 步骤 4: 完全重建（如果上述都没问题）

```bash
docker-compose down -v
docker-compose up -d --force-recreate
```

### 步骤 5: 检查网络连接

```bash
# 测试到 WhatsApp 服务器的连接
ping web.whatsapp.com

# 在容器内测试
docker exec evolution-api ping -c 3 web.whatsapp.com
```

如果 ping 失败，说明网络问题，可能需要配置代理。

---

## 📊 性能监控

修复后，在应用控制台查看详细时间：

```
[useEvolutionAPI] 🎉 Connection initialization completed in XXXXms
[ConnectionState] ✅ Chat sync completed in XXXms
[ConnectionState] 🎉 Total connection time: XXXXms
```

**目标时间**: 总时长应在 2000-5000ms 之间

---

**提示**: 首次修复后建议完全重启 Docker 和应用，以确保所有配置生效。
