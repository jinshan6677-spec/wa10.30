import { ipcMain, BrowserWindow } from 'electron';

import { environment } from '../shared/config/environment';
import type { GetChatsRequest, UpdateChatRequest } from '../shared/types/chat.types';
import type { CreateInstanceRequest, DisconnectOptions } from '../shared/types/evolution-api.types';
import type {
  GetMessagesRequest,
  MarkMessageReadRequest,
  UpdateMessageStatusRequest,
} from '../shared/types/message.types';

import { ChatService } from './services/chat.service';
import { EvolutionAPIService } from './services/evolution-api.service';
import { MessageService } from './services/message.service';
import { securityService } from './services/security.service';

/**
 * Evolution API 服务实例 (单例)
 */
let evolutionAPIService: EvolutionAPIService | null = null;

/**
 * Chat 服务实例 (单例)
 */
let chatService: ChatService | null = null;

/**
 * Message 服务实例 (单例)
 */
let messageService: MessageService | null = null;

/**
 * 设置 WebSocket 事件转发到渲染进程
 */
function setupWebSocketEventForwarding(service: EvolutionAPIService): void {
  const mainWindow = BrowserWindow.getAllWindows()[0];
  if (!mainWindow) {
    return;
  }

  service.on('websocket:connected', () => {
    mainWindow.webContents.send('evolution-api:websocket-connected');
  });

  service.on('websocket:disconnected', (data: unknown) => {
    mainWindow.webContents.send('evolution-api:websocket-disconnected', data);
  });

  service.on('websocket:error', (data: unknown) => {
    mainWindow.webContents.send('evolution-api:websocket-error', data);
  });

  service.on('connection:update', (data: unknown) => {
    mainWindow.webContents.send('evolution-api:connection-update', data);
  });

  service.on('qrcode:updated', (data: unknown) => {
    mainWindow.webContents.send('evolution-api:qrcode-updated', data);
  });

  service.on('reconnect:attempt', (data: unknown) => {
    mainWindow.webContents.send('evolution-api:reconnect-attempt', data);
  });

  service.on('reconnect:failed', () => {
    mainWindow.webContents.send('evolution-api:reconnect-failed');
  });
}

/**
 * 初始化 Evolution API 服务
 */
async function initializeEvolutionAPI(): Promise<EvolutionAPIService> {
  if (evolutionAPIService) {
    console.log('[IPC] Evolution API service already initialized');
    // 确保 MessageService 监听器已设置（防止应用重启后监听器丢失）
    if (messageService) {
      console.log('[IPC] Ensuring MessageService listeners are set up');
      messageService.setupWebSocketListeners();
    }
    return evolutionAPIService;
  }

  // 初始化加密密钥
  const encryptionKey = environment.getEncryptionKey();
  if (encryptionKey) {
    securityService.initializeEncryptionKey(encryptionKey);
  }

  // 强制使用环境变量中的 API 密钥，确保配置更改立即生效
  // 临时修复：总是使用环境变量，避免密钥链缓存问题
  const envApiKey = environment.getEvolutionAPIKey();
  if (!envApiKey) {
    throw new Error('Evolution API key not configured in environment');
  }

  const apiKey = envApiKey;
  // 更新密钥链中的密钥（为将来使用）
  await securityService.storeAPIKey('evolution-api', apiKey);
  console.log('[IPC] Using API key from environment variables (forced)');
  console.log('[IPC] API key:', `${apiKey.substring(0, 10)}...`);

  // 创建服务实例
  evolutionAPIService = new EvolutionAPIService({
    baseURL: environment.getEvolutionAPIBaseURL(),
    apiKey,
    instancePrefix: environment.getEvolutionInstancePrefix(),
  });

  // 设置 WebSocket 事件转发到渲染进程
  setupWebSocketEventForwarding(evolutionAPIService);

  // 初始化 Chat 服务
  if (!chatService) {
    chatService = new ChatService(evolutionAPIService);
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      chatService.setMainWindow(mainWindow);
    }
    console.log('[IPC] Chat service initialized');
  }

  // 初始化 Message 服务
  if (!messageService) {
    messageService = new MessageService(evolutionAPIService);
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      messageService.setMainWindow(mainWindow);
    }
    // 设置 WebSocket 事件监听
    messageService.setupWebSocketListeners();
    console.log('[IPC] Message service initialized');
  }

  console.log('[IPC] Evolution API service initialized');
  return evolutionAPIService;
}

/**
 * 注册所有 IPC handlers
 */
export function registerIPCHandlers(): void {
  // Evolution API: 创建实例
  ipcMain.handle('evolution-api:createInstance', async (_event, instanceName: string) => {
    try {
      const service = await initializeEvolutionAPI();

      // 检查实例是否已存在
      const exists = await service.instanceExists(instanceName);
      if (exists) {
        console.log('[IPC] Instance already exists:', instanceName);

        // 检查实例是否已连接（避免重复创建导致的延迟）
        try {
          const status = await service.getConnectionStatus(instanceName);
          if (status.state === 'open') {
            console.log('[IPC] Instance already connected, skipping creation');
            return {
              success: true,
              data: {
                instance: { instanceName },
                alreadyConnected: true, // 标记已连接，前端可以跳过QR流程
              },
            };
          }
        } catch (err) {
          console.log('[IPC] Could not check connection status, continuing with creation');
        }

        return { success: true, data: { instance: { instanceName } } };
      }

      const request: CreateInstanceRequest = {
        instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',

        // 性能优化参数 - 基于 Evolution API 官方最佳实践
        reject_call: true,              // 自动拒绝来电，避免阻塞连接
        websocket_enabled: true,        // 启用WebSocket
        websocket_events: [             // 只订阅必要事件，减少处理开销
          'CONNECTION_UPDATE',          // 连接状态更新
          'QRCODE_UPDATED',            // QR码更新
          'MESSAGES_UPSERT',           // 新消息（接收和发送）
          'MESSAGES_UPDATE',           // 消息状态更新（已读/已送达）
          'CHATS_UPSERT',              // 聊天列表更新
        ],

        // 🔥 关键性能优化配置 (加快 6-10 倍连接速度)
        settings: {
          sync_full_history: false,     // 禁用完整历史同步 (最重要!)
          sync_messages_count: 10,      // 🔥 优化：只同步最近10条消息（从20减少）
          auto_download_media: false,   // 不自动下载媒体文件
          always_online: true,          // 保持在线状态
          read_messages: false,         // 不自动标记已读
          read_status: false,           // 不自动标记状态已读
          groups_ignore: true,          // 🔥 优化：暂时忽略群组加快连接
        },
      };

      const response = await service.createInstance(request);
      console.log('[IPC] Instance created:', instanceName);
      return { success: true, data: response };
    } catch (error) {
      console.error('[IPC] Failed to create instance:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  });

  // Evolution API: 获取二维码
  ipcMain.handle('evolution-api:getQRCode', async (_event, instanceName: string) => {
    try {
      const service = await initializeEvolutionAPI();
      const qrCode = await service.getQRCode(instanceName);
      console.log('[IPC] QR code retrieved for:', instanceName);
      return { success: true, data: qrCode };
    } catch (error) {
      console.error('[IPC] Failed to get QR code:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  });

  // Evolution API: 获取连接状态
  ipcMain.handle('evolution-api:getConnectionStatus', async (_event, instanceName: string) => {
    try {
      const service = await initializeEvolutionAPI();
      const status = await service.getConnectionStatus(instanceName);
      return { success: true, data: status };
    } catch (error) {
      console.error('[IPC] Failed to get connection status:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  });

  // Evolution API: 断开连接
  ipcMain.handle(
    'evolution-api:disconnect',
    async (_event, instanceName: string, options?: DisconnectOptions) => {
      try {
        const service = await initializeEvolutionAPI();
        await service.disconnect(instanceName, options);
        console.log('[IPC] Disconnected:', instanceName);
        return { success: true };
      } catch (error) {
        console.error('[IPC] Failed to disconnect:', error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    },
  );

  // Evolution API: 连接 WebSocket
  ipcMain.handle('evolution-api:connectWebSocket', async (_event, instanceName: string) => {
    try {
      const service = await initializeEvolutionAPI();
      service.connectWebSocket(instanceName, { reconnect: true });
      console.log('[IPC] WebSocket connecting for:', instanceName);
      return { success: true };
    } catch (error) {
      console.error('[IPC] Failed to connect WebSocket:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  });

  // Evolution API: 断开 WebSocket
  ipcMain.handle('evolution-api:disconnectWebSocket', async () => {
    try {
      if (evolutionAPIService) {
        evolutionAPIService.disconnectWebSocket();
        console.log('[IPC] WebSocket disconnected');
      }
      return { success: true };
    } catch (error) {
      console.error('[IPC] Failed to disconnect WebSocket:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  });

  // Chat Service: 同步聊天列表
  ipcMain.handle('chat:sync', async (_event, instanceName: string) => {
    try {
      if (!chatService) {
        await initializeEvolutionAPI(); // 确保服务已初始化
      }

      if (!chatService) {
        throw new Error('Chat service not initialized');
      }

      chatService.setInstanceName(instanceName);
      await chatService.syncChats(instanceName);

      console.log('[IPC] Chats synced for instance:', instanceName);
      return { success: true };
    } catch (error) {
      console.error('[IPC] Failed to sync chats:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  });

  // Chat Service: 获取聊天列表
  ipcMain.handle('chat:get-list', async (_event, request: GetChatsRequest) => {
    try {
      if (!chatService) {
        throw new Error('Chat service not initialized');
      }

      const response = await chatService.getChats(request);
      return { success: true, data: response };
    } catch (error) {
      console.error('[IPC] Failed to get chat list:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  });

  // Chat Service: 获取联系人信息
  ipcMain.handle('chat:get-contact-info', async (_event, whatsappId: string) => {
    try {
      if (!chatService) {
        throw new Error('Chat service not initialized');
      }

      const contactInfo = await chatService.getContactInfo(whatsappId);
      return { success: true, data: contactInfo };
    } catch (error) {
      console.error('[IPC] Failed to get contact info:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  });

  // Chat Service: 搜索聊天
  ipcMain.handle('chat:search', async (_event, query: string, limit?: number) => {
    try {
      if (!chatService) {
        throw new Error('Chat service not initialized');
      }

      const chats = await chatService.searchChats(query, limit);
      return { success: true, data: chats };
    } catch (error) {
      console.error('[IPC] Failed to search chats:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  });

  // Chat Service: 更新聊天（置顶/归档）
  ipcMain.handle('chat:update', async (_event, request: UpdateChatRequest) => {
    try {
      if (!chatService) {
        throw new Error('Chat service not initialized');
      }

      await chatService.updateChat(request);
      return { success: true };
    } catch (error) {
      console.error('[IPC] Failed to update chat:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  });

  // Message Service: 获取消息列表
  ipcMain.handle('message:get-list', async (_event, request: GetMessagesRequest) => {
    try {
      if (!messageService) {
        await initializeEvolutionAPI(); // 确保服务已初始化
      }

      if (!messageService) {
        throw new Error('Message service not initialized');
      }

      const response = await messageService.getMessages(request);
      return { success: true, data: response };
    } catch (error) {
      console.error('[IPC] Failed to get message list:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  });

  // Message Service: 订阅消息实时更新
  ipcMain.handle('message:subscribe', async (_event, chatId: string) => {
    try {
      if (!messageService) {
        await initializeEvolutionAPI();
      }

      if (!messageService) {
        throw new Error('Message service not initialized');
      }

      messageService.subscribeToMessages(chatId);
      return { success: true };
    } catch (error) {
      console.error('[IPC] Failed to subscribe to messages:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  });

  // Message Service: 取消订阅消息
  ipcMain.handle('message:unsubscribe', async (_event, chatId: string) => {
    try {
      if (!messageService) {
        throw new Error('Message service not initialized');
      }

      messageService.unsubscribeFromMessages(chatId);
      return { success: true };
    } catch (error) {
      console.error('[IPC] Failed to unsubscribe from messages:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  });

  // Message Service: 标记消息为已读
  ipcMain.handle('message:mark-read', async (_event, request: MarkMessageReadRequest) => {
    try {
      if (!messageService) {
        throw new Error('Message service not initialized');
      }

      await messageService.markMessagesAsRead(request);
      return { success: true };
    } catch (error) {
      console.error('[IPC] Failed to mark messages as read:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  });

  // Message Service: 更新消息状态
  ipcMain.handle('message:update-status', async (_event, request: UpdateMessageStatusRequest) => {
    try {
      if (!messageService) {
        throw new Error('Message service not initialized');
      }

      await messageService.updateMessageStatus(request);
      return { success: true };
    } catch (error) {
      console.error('[IPC] Failed to update message status:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  });

  // Message Service: 发送文本消息
  ipcMain.handle(
    'message:send',
    async (
      _event,
      params: { chatId: string; content: string; instanceId: string },
    ) => {
      try {
        if (!messageService) {
          await initializeEvolutionAPI();
        }

        if (!messageService) {
          throw new Error('Message service not initialized');
        }

        const { chatId, content, instanceId } = params;
        const message = await messageService.sendTextMessage(chatId, content, instanceId);

        console.log('[IPC] Message sent successfully:', message.id);
        return { success: true, data: message };
      } catch (error) {
        console.error('[IPC] Failed to send message:', error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    },
  );

  // Message Service: 发送输入状态（typing indicator）
  ipcMain.handle(
    'message:send-typing-status',
    async (
      _event,
      params: { chatId: string; isTyping: boolean; instanceId: string },
    ) => {
      try {
        if (!messageService) {
          await initializeEvolutionAPI();
        }

        if (!messageService) {
          throw new Error('Message service not initialized');
        }

        const { chatId, isTyping, instanceId } = params;
        await messageService.sendTypingStatus(chatId, isTyping, instanceId);

        return { success: true };
      } catch (error) {
        console.error('[IPC] Failed to send typing status:', error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    },
  );

  // Message Service: 设置实例名
  ipcMain.handle('message:set-instance', async (_event, instanceName: string) => {
    try {
      if (!messageService) {
        await initializeEvolutionAPI();
      }

      if (!messageService) {
        throw new Error('Message service not initialized');
      }

      messageService.setInstanceName(instanceName);
      console.log('[IPC] Message service instance name set to:', instanceName);
      return { success: true };
    } catch (error) {
      console.error('[IPC] Failed to set message service instance:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  });

  // 🔥 诊断：手动测试消息接收流程
  ipcMain.handle('test:simulate-message', async (_event, chatId: string) => {
    try {
      console.log('[IPC] 🧪 Simulating test message for chat:', chatId);

      if (!messageService) {
        throw new Error('Message service not initialized');
      }

      // 创建测试消息
      const testMessage = {
        id: `test_${Date.now()}`,
        chatId,
        senderId: 'test_sender',
        senderName: '测试发送者',
        content: `这是一条测试消息 - ${new Date().toLocaleTimeString()}`,
        timestamp: Date.now(),
        status: 'read' as any,
        type: 'text' as any,
        isGroupChat: false,
        isOwn: false,
      };

      // 直接调用 mainWindow.webContents.send 模拟消息接收
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        console.log('[IPC] 🧪 Sending test message to renderer:', testMessage);
        mainWindow.webContents.send('message:new', {
          chatId,
          messages: [testMessage],
        });
        console.log('[IPC] ✅ Test message sent');
        return { success: true, message: testMessage };
      }
      throw new Error('Main window not found');

    } catch (error) {
      console.error('[IPC] ❌ Failed to simulate message:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  });

  console.log('[IPC] All Evolution API, Chat, and Message handlers registered');
}

/**
 * 清理 Evolution API 服务
 */
export function cleanupEvolutionAPI(): void {
  if (messageService) {
    messageService = null;
    console.log('[IPC] Message service cleaned up');
  }

  if (chatService) {
    chatService.cleanupService();
    chatService = null;
    console.log('[IPC] Chat service cleaned up');
  }

  if (evolutionAPIService) {
    evolutionAPIService.destroy();
    evolutionAPIService = null;
    console.log('[IPC] Evolution API service cleaned up');
  }
}
