# WhatsApp 连接问题分析与修复方案

**问题日期**: 2025-11-01
**问题报告**:
1. 手机扫码后，需要很长时间才能连接上
2. 连接上之后没有跳转到聊天页面

---

## 🔍 问题分析

### 问题 1: 连接延迟（扫码后很长时间才连接）

####  根本原因
通过 Evolution API 容器日志分析，发现两个关键错误：

```bash
# 错误 1: Redis 连接失败（每秒2次）
[ERROR] [Redis] redis disconnected

# 错误 2: Baileys 预密钥上传超时
{"err":{"message":"Pre-key upload timeout"}}
```

#### 详细分析

**1. Redis 配置问题**
- Evolution API 默认尝试连接 Redis 进行缓存和会话管理
- 我们的 `docker-compose.yml` 中**没有配置 Redis**
- 导致每秒产生大量连接失败日志，影响性能

**2. Baileys 库超时**
- Baileys 是 WhatsApp Web API 的开源实现
- "Pre-key upload timeout" 表示上传加密密钥到 WhatsApp 服务器超时
- 根据 Evolution API GitHub Issue #1014，这通常由以下原因导致：
  - 网络延迟
  - WhatsApp 服务器响应慢
  - Baileys 配置不当
  - 同步历史消息过多

**3. 历史同步配置**
- 当前配置了 `sync_full_history: false` 和 `sync_messages_count: 20`
- 但可能仍然同步了大量数据导致延迟

---

### 问题 2: 连接后未自动跳转到聊天页面

#### 根本原因
需要检查前端路由逻辑和 WebSocket 事件处理

#### 可能的问题
1. `connection.update` 事件未正确触发 `state: 'open'`
2. 前端 `useEffect` 跳转逻辑存在竞态条件
3. WebSocket 事件延迟到达前端

---

## 🛠️ 修复方案

### 方案 1: 优化 Evolution API Docker 配置

#### 1.1 禁用 Redis（立即生效）

在 `docker-compose.yml` 中添加环境变量：

```yaml
environment:
  # 🔥 禁用 Redis 缓存（避免连接失败日志）
  CACHE_REDIS_ENABLED: "false"
  CACHE_REDIS_URI: ""
  CACHE_LOCAL_ENABLED: "true"  # 使用本地内存缓存
```

#### 1.2 优化 Baileys 配置

```yaml
environment:
  # 🔥 增加超时时间（解决 Pre-key upload timeout）
  BAILEYS_CONNECTION_TIMEOUT: "60000"  # 60秒（默认30秒）

  # 🔥 减少初始化延迟
  QRCODE_LIMIT: 10  # 减少到10次（原30次）
```

#### 1.3 进一步优化历史同步

```yaml
settings: {
  sync_full_history: false,
  sync_messages_count: 10,     # 🔥 从20减少到10
  auto_download_media: false,
  always_online: true,
  read_messages: false,
  read_status: false,
  groups_ignore: true,        # 🔥 暂时忽略群组消息
}
```

---

### 方案 2: 修复前端自动跳转逻辑

#### 2.1 当前代码分析

**文件**: `src/renderer/App.tsx`

```typescript
// 当前代码
useEffect(() => {
  if (connectionState.status === ConnectionStatus.CONNECTED) {
    console.log('[WhatsAppConnection] Connected! Auto-redirecting to /chat...');
    navigate('/chat', { replace: true });
  }
}, [connectionState.status, navigate]);
```

**问题**:
- 依赖数组包含 `navigate`，可能导致 React 重新创建函数
- 缺少对 `location` 的检查，可能在已经在 `/chat` 时重复跳转

#### 2.2 修复代码

```typescript
// 🔥 修复后
useEffect(() => {
  // 只在 setup 页面时跳转
  if (
    connectionState.status === ConnectionStatus.CONNECTED &&
    location.pathname === '/setup'
  ) {
    console.log('[WhatsAppConnection] Connected! Auto-redirecting to /chat...');
    navigate('/chat', { replace: true });
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [connectionState.status]); // 🔥 移除 navigate 依赖
```

---

### 方案 3: 增强 WebSocket 事件处理

#### 3.1 添加详细日志

在 `ConnectionStateContext.tsx` 中增强日志：

```typescript
const handleConnectionUpdate = (data: ConnectionUpdateEvent) => {
  console.log('[ConnectionState] 📡 Connection update RAW data:', JSON.stringify(data, null, 2));
  console.log('[ConnectionState] 📊 Current status:', connectionState.status);
  console.log('[ConnectionState] 📊 New state:', data.state);

  // ... existing logic
};
```

#### 3.2 添加状态转换验证

```typescript
if (data.state === 'open') {
  console.log('[ConnectionState] ✅ Connection OPEN event received');
  console.log('[ConnectionState] 📱 Phone number:', phoneNumber);
  console.log('[ConnectionState] 🔑 Instance key:', data.instance);

  // 验证所有必需字段
  if (!data.instance) {
    console.error('[ConnectionState] ❌ Missing instance name in connection update!');
    return;
  }

  // ... existing logic
}
```

---

## 📋 修复步骤

### 第一步: 修复 Docker 配置（优先级：🔴 紧急）

1. 停止现有容器
```bash
docker-compose down
```

2. 修改 `docker-compose.yml` 文件

3. 重新启动容器
```bash
docker-compose up -d
```

4. 验证日志
```bash
docker-compose logs evolution-api --tail=50 | grep -i error
```

**预期结果**: 不再看到 "redis disconnected" 错误

---

### 第二步: 修复前端跳转逻辑（优先级：🟡 高）

1. 修改 `src/renderer/App.tsx`
2. 添加 `location` 检查
3. 移除不必要的依赖

---

### 第三步: 增强日志和监控（优先级：🟢 中）

1. 在所有关键位置添加详细日志
2. 验证事件流程：
   - QR 码生成
   - 扫码识别
   - connection.update (state: 'connecting')
   - connection.update (state: 'open')
   - 页面跳转

---

## 🧪 测试验证

### 测试场景 1: 首次连接

```
步骤：
1. 清除所有实例（DELETE /instance/:instanceName）
2. 启动应用
3. 扫描二维码
4. 观察日志和时间

预期结果：
- ✅ 扫码后 5-10 秒内连接成功（不再是几分钟）
- ✅ 自动跳转到 /chat 页面
- ✅ 容器日志无 Redis 错误
- ✅ 容器日志无 Pre-key timeout 错误
```

### 测试场景 2: 会话恢复

```
步骤：
1. 连接成功后关闭应用
2. 重新启动应用

预期结果：
- ✅ 自动恢复会话（无需扫码）
- ✅ 直接进入 /chat 页面
- ✅ 2-3 秒内完成恢复
```

---

## 🎯 成功标准

### 性能指标
- **扫码连接时间**: < 15 秒（当前：几分钟）
- **会话恢复时间**: < 5 秒
- **页面跳转延迟**: < 1 秒

### 稳定性指标
- **容器健康状态**: healthy（当前：unhealthy）
- **Redis 错误日志**: 0 条/分钟（当前：120 条/分钟）
- **WebSocket 连接成功率**: 100%

---

## 📚 参考资料

### Evolution API 官方资源
- GitHub: https://github.com/EvolutionAPI/evolution-api
- Issue #1014: Baileys WS Connection Error
- Documentation: https://doc.evolution-api.com

### 已确认的解决方案
1. **禁用 Redis**: `CACHE_REDIS_ENABLED: "false"`
2. **优化 Baileys**: 增加超时，减少历史同步
3. **忽略群组**: `groups_ignore: true` (可选)

---

## 🚨 风险评估

### 低风险修改
- ✅ 禁用 Redis（不影响核心功能）
- ✅ 增加超时时间
- ✅ 减少历史同步数量

### 中风险修改
- ⚠️ 修改前端跳转逻辑（需要充分测试）
- ⚠️ 忽略群组消息（可能影响用户需求）

### 建议
1. 先执行低风险修改，验证效果
2. 如果问题未解决，再执行中风险修改
3. 每次修改后进行完整测试

---

**下一步**: 立即执行第一步修复 Docker 配置
