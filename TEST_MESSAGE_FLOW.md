# 消息接收流程诊断指南 (2025-11-01更新)

> **🔥 最新更新:** 已添加全局Socket.IO事件捕获、测试端点、增强型日志记录

## 📋 诊断工具概览

本指南包含**系统性诊断流程**，用于排查消息接收问题：

1. **全局事件捕获器** - 捕获所有Socket.IO事件，包括未知事件
2. **原始数据日志** - 完整JSON输出，验证数据结构
3. **测试端点** - 跳过WebSocket，直接测试IPC→UI路径
4. **增强日志链** - 端到端追踪：WebSocket → Evolution API → MessageService → IPC → MessageContext → UI

### 🎯 快速诊断建议

**第一次排查？直接跳到[第五步](#第五步使用新增的诊断工具-2025-11-01)使用测试端点快速定位问题区域。**

---

## 第一步：验证Evolution API服务器运行

打开浏览器访问：
```
http://localhost:8080
```

**期望结果：** 看到Evolution API欢迎页面

如果看不到，说明Evolution API服务器未运行。

---

## 第二步：检查控制台日志（按顺序）

启动应用后，按下面的顺序检查日志：

### 2.1 应用启动日志
```
[IPC] Evolution API service initialized
[IPC] Chat service initialized
[IPC] Message service initialized
[MessageService] WebSocket listeners registered
```

**如果看不到这些日志：** MessageService未正确初始化

---

### 2.2 WebSocket连接日志
```
[Evolution API] Connecting to Global WebSocket: http://localhost:8080
[Evolution API] Listening for instance: whatsapp_xxx
[Evolution API] WebSocket connected
```

**如果看不到`WebSocket connected`：**
- Evolution API服务器可能未启用WebSocket
- 需要在Evolution API的`.env`中添加：
  ```
  WEBSOCKET_ENABLED=true
  WEBSOCKET_GLOBAL_EVENTS=true
  ```

---

### 2.3 WhatsApp连接成功日志
```
[ConnectionState] ✅ WhatsApp connected successfully!
[ConnectionState] 🔧 Setting MessageService instance: whatsapp_xxx
[MessageService] Instance name set to: whatsapp_xxx
```

**如果看不到`Setting MessageService instance`：**
- WhatsApp未成功连接
- 或ConnectionStateContext代码有问题

---

### 2.4 MessageContext注册日志
```
[MessageContext] Setting up message event listeners
[MessageContext] Event listeners registered successfully
```

**如果看不到：** React组件未正确挂载

---

### 2.5 发送测试消息后的日志

**期望看到（按顺序）：**
```
[Evolution API] WebSocket received messages.upsert: { instance: 'whatsapp_xxx', currentInstance: 'whatsapp_xxx', willProcess: true }
[Evolution API] Emitting messages.upsert event
[MessageService] Received 1 new message(s) for chat: 1234567890@s.whatsapp.net
[MessageContext] 🎉 Received message:new event: { chatId: '...', messageCount: 1 }
[MessageContext] Updated messages for chat: { chatId: '...', totalMessages: X }
```

---

## 第三步：诊断问题

### 问题A：看不到`[Evolution API] WebSocket connected`

**原因：** Evolution API服务器WebSocket未启用

**解决方案：**
1. 进入Evolution API服务器目录
2. 编辑`.env`文件，添加：
   ```bash
   WEBSOCKET_ENABLED=true
   WEBSOCKET_GLOBAL_EVENTS=true
   ```
3. 重启Evolution API服务器：
   ```bash
   docker-compose restart
   # 或
   pm2 restart evolution-api
   ```

---

### 问题B：看到WebSocket连接，但看不到`messages.upsert`事件

**原因1：** Evolution API实例未配置WebSocket事件

**解决方案：** 删除现有实例，重新创建（应用会自动配置正确的事件订阅）

**原因2：** 实例名不匹配

**检查：** 查看日志中的`willProcess`是`true`还是`false`

---

### 问题C：看到`messages.upsert`但`willProcess: false`

**原因：** 实例名不匹配

**检查日志：**
```
[Evolution API] WebSocket received messages.upsert: {
  instance: 'whatsapp_actual_instance',
  currentInstance: 'whatsapp_stored_instance',
  willProcess: false  ← 这里是false
}
```

**解决方案：** currentInstanceName设置错误，检查ConnectionStateContext

---

### 问题D：看到`MessageService.Received`但没有`MessageContext`日志

**原因：** IPC事件未正确转发到渲染进程

**检查：**
1. preload.ts是否正确注册`message:new`频道
2. MessageContext是否正确使用`window.electronAPI.on('message:new')`

---

### 问题E：全部日志都有，但UI不显示

**原因：** React状态更新问题或ConversationWindow未正确渲染

**检查：**
1. 是否选中了聊天（selectedChatId）
2. ConversationWindow的chatId prop是否正确

---

## 第四步：手动测试WebSocket

在浏览器控制台测试Evolution API的WebSocket：

```javascript
const socket = io('http://localhost:8080', {
  transports: ['websocket'],
  extraHeaders: {
    apikey: 'dev_test_key_12345'
  }
});

socket.on('connect', () => {
  console.log('Connected!');
});

socket.on('messages.upsert', (data) => {
  console.log('Received message:', data);
});
```

如果这个能收到消息，说明Evolution API服务器正常，问题在我们的应用代码。

---

## 第五步：使用新增的诊断工具 (2025-11-01)

### 5.1 全局事件监听器

应用现在会捕获**所有**Socket.IO事件，即使是未知的事件也会被记录：

**期望看到：**
```
[Evolution API] 🎯 Socket.IO received event: messages.upsert
[Evolution API] 🎯 Event data: {
  "instance": "whatsapp_xxx",
  "data": { ... }
}
```

**如果看不到任何🎯日志：** WebSocket根本没有收到任何事件

**如果看到其他事件名：** Evolution API可能在发送不同的事件名，检查事件名是否匹配

---

### 5.2 原始数据结构日志

所有WebSocket事件现在都会完整输出JSON结构：

**期望看到：**
```
[Evolution API] WebSocket received messages.upsert RAW: {
  "instance": "whatsapp_xxx",
  "data": {
    "key": { ... },
    "message": { ... },
    "remoteJid": "1234567890@s.whatsapp.net"
  }
}
```

**用途：** 检查Evolution API实际发送的数据结构是否符合我们的MessagesUpsertEvent类型定义

---

### 5.3 测试端点 - 跳过WebSocket验证IPC→UI路径

在浏览器开发者工具控制台运行：

```javascript
// 选中一个聊天后，手动触发测试消息
window.electronAPI.messageAPI.simulateMessage('1234567890@s.whatsapp.net')
  .then(result => console.log('Test result:', result));
```

**期望结果：**
1. 控制台返回 `{ success: true, message: {...} }`
2. 对话窗口立即出现一条测试消息
3. 看到以下日志：
```
[IPC] 🧪 Simulating test message for chat: 1234567890@s.whatsapp.net
[MessageContext] 🎉 Received message:new event: { chatId: '...', messageCount: 1 }
[MessageContext] Updated messages for chat: { chatId: '...', totalMessages: X }
```

**诊断价值：**
- ✅ 如果测试消息能显示：说明IPC→MessageContext→UI路径完全正常，问题在WebSocket/Evolution API
- ❌ 如果测试消息不显示：说明问题在渲染进程(MessageContext或ConversationWindow)

---

### 5.4 增强的连接日志

WebSocket连接成功时现在会显示更多信息：

```
[Evolution API] ✅ WebSocket connected successfully!
[Evolution API] Socket ID: abc123xyz
[Evolution API] Listening for instance: whatsapp_xxx
```

**检查：** Socket ID应该是一个非空字符串，确认连接是真实建立的

---

## 第六步：系统性排查流程

### 排查顺序

1. **先运行测试端点** (5.3)
   - 能显示 → 问题在WebSocket
   - 不能显示 → 问题在React组件

2. **检查全局事件日志** (5.1)
   - 有🎯日志 → WebSocket工作正常，检查事件名
   - 无🎯日志 → WebSocket没收到任何事件

3. **检查原始数据结构** (5.2)
   - 比对数据结构和MessagesUpsertEvent类型定义
   - 查看instance字段是否匹配

4. **检查每个环节的日志链**
   - WebSocket收到 (🎯)
   - EvolutionAPI处理 (messages.upsert RAW)
   - MessageService处理 (Received X new message(s))
   - IPC发送
   - MessageContext接收 (🎉 Received message:new)
   - UI更新

---

## 下一步

### 推荐诊断流程

1. **启动应用并连接WhatsApp**

2. **立即运行测试端点** (第五步 5.3)
   ```javascript
   // 在浏览器开发者工具控制台
   window.electronAPI.messageAPI.simulateMessage('选中的聊天ID')
   ```

   **如果测试消息显示：**
   - ✅ React组件工作正常
   - ✅ IPC通道工作正常
   - ❌ 问题在WebSocket/Evolution API
   - 👉 继续第3步

   **如果测试消息不显示：**
   - ❌ 问题在渲染进程
   - 👉 检查MessageContext或ConversationWindow组件
   - 👉 查看浏览器控制台是否有React错误

3. **从手机发送测试消息，检查日志链**

   **期望看到完整的日志链：**
   ```
   [Evolution API] 🎯 Socket.IO received event: messages.upsert
   [Evolution API] WebSocket received messages.upsert RAW: {...}
   [Evolution API] Emitting messages.upsert event
   [MessageService] Received 1 new message(s) for chat: ...
   [MessageContext] 🎉 Received message:new event: ...
   [MessageContext] Updated messages for chat: ...
   ```

   **在哪个环节断了？**
   - 🎯 都看不到 → WebSocket未连接或Evolution API未发送事件
   - 🎯 能看到，RAW看不到 → 事件名不匹配
   - RAW能看到，MessageService看不到 → 实例名不匹配或EventEmitter未连接
   - MessageService能看到，MessageContext看不到 → IPC通道问题
   - MessageContext能看到，UI不更新 → React状态更新问题

4. **报告结果**

   请提供：
   - 测试端点结果（能显示/不能显示）
   - 日志链的哪个环节看不到了
   - 🎯全局事件日志（是否捕获到任何事件）
   - 原始数据结构（如果有）

### 已修复的问题 (2025-11-01)

✅ **修复#1:** WebSocket事件名不匹配 (evolution-api.service.ts)
✅ **修复#2:** MessageService实例名未设置 (ConnectionStateContext)
✅ **修复#3:** MESSAGES_UPDATE事件未订阅 (ipc-handlers.ts)
✅ **增强:** 添加socket.onAny()全局事件捕获
✅ **增强:** 原始JSON数据日志
✅ **工具:** 测试端点用于隔离测试

这样我就能准确定位问题！
