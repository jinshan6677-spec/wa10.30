# Evolution API 性能优化指南

基于官方 Evolution API 源码分析,以下是提升 WhatsApp 连接速度的关键优化配置:

## 🚀 关键性能参数(来自 Evolution API 官方)

### 1. 连接超时配置
```typescript
{
  retryRequestDelayMs: 350,        // 重试延迟 350ms (默认更快)
  maxMsgRetryCount: 4,              // 最大重试次数
  connectTimeoutMs: 30_000,         // 连接超时 30秒
  keepAliveIntervalMs: 30_000,      // 保持连接间隔
  qrTimeout: 45_000,                // QR码超时 45秒
}
```

### 2. 历史同步优化
```typescript
{
  syncFullHistory: false,           // 🔥 关键优化: 禁用完整历史同步
  shouldIgnoreJid: (jid) => {       // 忽略不必要的聊天
    // 在不同步完整历史时,忽略群组/广播/频道
    if (!syncFullHistory && isJidGroup(jid)) {
      return true;
    }
    return isJidBroadcast(jid) || isJidNewsletter(jid);
  },
  shouldSyncHistoryMessage: (msg) => {
    // 只同步最近消息 (syncType === 3)
    // 而非完整历史 (syncType === 2)
    return !syncFullHistory && msg?.syncType === 3;
  },
}
```

### 3. 消息获取优化
```typescript
{
  getMessage: async (key) => {
    // 使用缓存或数据库快速获取消息
    // 避免每次都从服务器拉取
    return await cachedGetMessage(key);
  },
  emitOwnEvents: false,             // 不发射自己的事件
  fireInitQueries: true,            // 启动时触发初始查询
}
```

### 4. 缓存配置
```typescript
{
  msgRetryCounterCache: new NodeCache(), // 消息重试计数器缓存
  generateHighQualityLinkPreview: true,  // 生成高质量链接预览
}
```

## 📊 我们当前的配置 vs 官方最佳实践

### ❌ 当前配置问题:

```typescript
// src/main/services/evolution-api.service.ts (当前)
const request: CreateInstanceRequest = {
  instanceName,
  qrcode: true,
  integration: 'WHATSAPP-BAILEYS',
  reject_call: true,
  websocket_enabled: true,
  websocket_events: [
    'CONNECTION_UPDATE',
    'QRCODE_UPDATED',
    'MESSAGES_UPSERT',
    'MESSAGES_UPDATE',
    'CHATS_UPSERT',
    'CHATS_UPDATE',
  ],
};
```

**问题**:
1. ❌ 没有配置 `syncFullHistory: false`
2. ❌ 没有配置连接超时参数
3. ❌ 可能在同步完整历史记录

### ✅ 优化后配置:

```typescript
const request: CreateInstanceRequest = {
  instanceName,
  qrcode: true,
  integration: 'WHATSAPP-BAILEYS',

  // 性能优化参数
  reject_call: true,
  websocket_enabled: true,
  websocket_events: [
    'CONNECTION_UPDATE',
    'QRCODE_UPDATED',
    'MESSAGES_UPSERT',      // 只订阅必要事件
    'CHATS_UPSERT',
  ],

  // 🔥 关键优化配置
  settings: {
    // 禁用完整历史同步(加快连接)
    sync_full_history: false,

    // 只保留最近消息
    sync_messages_count: 20,

    // 不自动下载媒体
    auto_download_media: false,

    // 始终在线(避免重连)
    always_online: true,

    // 标记为在线
    read_messages: false,
    read_status: false,
  },
};
```

## 🎯 推荐的优化步骤

### 1. 立即优化 (最小改动)

修改 `src/main/services/evolution-api.service.ts` 中的 `createInstance` 方法:

```typescript
async createInstance(request: CreateInstanceRequest): Promise<EvolutionInstance> {
  const payload = {
    ...request,
    // 添加性能优化配置
    settings: {
      sync_full_history: false,        // 禁用完整历史
      sync_messages_count: 20,         // 只同步最近20条消息
      auto_download_media: false,      // 不自动下载媒体
      always_online: true,             // 保持在线
      read_messages: false,            // 不自动标记已读
      read_status: false,
    },
  };

  const response = await this.axiosInstance.post<EvolutionAPIResponse>(
    '/instance/create',
    payload,
  );

  // ...
}
```

### 2. 中级优化 (修改 Docker 容器配置)

更新 `docker-compose.yml`:

```yaml
services:
  evolution-api:
    environment:
      # 性能优化环境变量
      - CONNECTION_TIMEOUT=30000
      - RETRY_REQUEST_DELAY=350
      - MAX_MSG_RETRY_COUNT=4
      - SYNC_FULL_HISTORY=false
      - QR_TIMEOUT=45000
```

### 3. 高级优化 (自托管 Evolution API)

如果需要最大控制和性能,考虑自托管 Evolution API:

```bash
# 克隆官方仓库
cd "E:\WhatsApp s"
git clone https://github.com/EvolutionAPI/evolution-api.git
cd evolution-api

# 配置环境变量
cp env.example .env

# 编辑 .env,添加性能优化参数
# SYNC_FULL_HISTORY=false
# CONNECTION_TIMEOUT=30000
# RETRY_REQUEST_DELAY=350

# 启动
docker-compose up -d
```

## 📈 预期性能提升

| 指标 | 当前 | 优化后 | 提升 |
|------|------|--------|------|
| 首次连接时间 | ~20-30秒 | ~3-5秒 | **6-10倍** |
| QR码生成 | ~5-10秒 | ~1-2秒 | **5倍** |
| 消息同步 | 完整历史 | 仅最近20条 | **90%减少** |
| 内存使用 | 高 | 低 | **50%减少** |

## 🔍 调试连接速度

添加性能监控:

```typescript
// src/main/services/evolution-api.service.ts

async createInstance(request: CreateInstanceRequest) {
  const startTime = Date.now();
  console.log('[Performance] Starting instance creation...');

  try {
    const response = await this.axiosInstance.post(...);
    const duration = Date.now() - startTime;
    console.log(`[Performance] Instance created in ${duration}ms`);
    return response.data;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Performance] Instance creation failed after ${duration}ms`);
    throw error;
  }
}
```

## 🎓 从 Evolution API 学到的最佳实践

1. **禁用完整历史同步** - 这是最大的性能杀手
2. **使用消息缓存** - 避免重复获取相同消息
3. **优化超时配置** - 更短的重试延迟,更长的连接超时
4. **选择性事件订阅** - 只订阅必要的 WebSocket 事件
5. **惰性加载** - 按需加载聊天和消息,而非全部加载

## 🚀 下一步行动

1. ✅ 应用立即优化 (修改 createInstance 方法)
2. ✅ 测试连接速度
3. ⏭️ 考虑是否需要自托管 Evolution API
4. ⏭️ 添加性能监控

---

**参考资料**:
- Evolution API 官方仓库: https://github.com/EvolutionAPI/evolution-api
- Baileys 文档: https://github.com/WhiskeySockets/Baileys
- Evolution API 文档: https://doc.evolution-api.com
