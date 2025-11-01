import axios, { type AxiosInstance } from 'axios';
import type { BrowserWindow } from 'electron';

import { environment } from '../../shared/config/environment';
import { MessageStatus } from '../../shared/types/chat.types';
import type {
  EvolutionMessage,
  MessagesUpsertEvent,
  MessagesUpdateEvent,
} from '../../shared/types/evolution-api.types';
import type {
  Message,
  MessageMetadata,
  MessageRecord,
  MessageType,
  GetMessagesRequest,
  GetMessagesResponse,
  MarkMessageReadRequest,
  UpdateMessageStatusRequest,
} from '../../shared/types/message.types';
import { MessageType as MessageTypeEnum } from '../../shared/types/message.types';

import { databaseService } from './database.service';
import type { EvolutionAPIService } from './evolution-api.service';

/**
 * 消息服务类
 * 负责管理消息数据、实时消息接收和Evolution API集成
 */
export class MessageService {
  private evolutionService: EvolutionAPIService;

  private axiosInstance: AxiosInstance;

  private mainWindow: BrowserWindow | null = null;

  private currentInstanceName: string | null = null;

  private subscribedChats: Set<string> = new Set();

  private listenersSetup: boolean = false;

  constructor(evolutionService: EvolutionAPIService) {
    this.evolutionService = evolutionService;

    // 创建 axios 实例用于 Evolution API 调用
    this.axiosInstance = axios.create({
      baseURL: environment.getEvolutionAPIBaseURL(),
      timeout: 30000,
      headers: {
        apikey: environment.getEvolutionAPIKey() || '',
      },
    });
  }

  /**
   * 确保数据库已初始化
   */
  private static async ensureDatabase(): Promise<boolean> {
    try {
      databaseService.getDatabase();
      return true;
    } catch {
      const success = await databaseService.initialize();
      return success;
    }
  }

  /**
   * 检查数据库是否可用
   */
  private static isDatabaseAvailable(): boolean {
    try {
      databaseService.getDatabase();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 设置主窗口引用（用于发送IPC事件）
   */
  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  /**
   * 设置当前实例名
   */
  setInstanceName(instanceName: string): void {
    this.currentInstanceName = instanceName;
  }

  /**
   * 从 Evolution API 获取消息历史
   */
  async fetchMessagesFromAPI(chatId: string, limit: number = 50): Promise<Message[]> {
    if (!this.currentInstanceName) {
      throw new Error('Instance name not set. Call setInstanceName() first.');
    }

    try {
      // 调用 Evolution API 获取消息历史
      // GET /message/findMessages/:instance?chatId=xxx&limit=50
      const response = await this.axiosInstance.get(
        `/message/findMessages/${this.currentInstanceName}`,
        {
          params: {
            chatId,
            limit,
          },
        },
      );

      const messages: EvolutionMessage[] = response.data.messages || [];
      return messages.map(msg => this.transformEvolutionMessage(msg, chatId));
    } catch (error) {
      console.error('[MessageService] Failed to fetch messages from API:', error);
      throw error;
    }
  }

  /**
   * 获取消息列表（优先从本地数据库，如果为空则从API获取）
   */
  async getMessages(request: GetMessagesRequest): Promise<GetMessagesResponse> {
    const { chatId, limit = 50, offset = 0, beforeTimestamp } = request;

    // 确保数据库已初始化
    await MessageService.ensureDatabase();

    try {
      let messages: MessageRecord[] = [];
      let total = 0;

      if (MessageService.isDatabaseAvailable()) {
        // 从本地数据库获取
        if (beforeTimestamp) {
          messages = databaseService.getMessagesBeforeTimestamp(chatId, beforeTimestamp, limit);
        } else {
          messages = databaseService.getMessagesByChatId(chatId, limit, offset);
        }

        // 如果本地数据库为空，从API获取并缓存
        if (messages.length === 0 && offset === 0 && !beforeTimestamp) {
          const apiMessages = await this.fetchMessagesFromAPI(chatId, limit);
          // 保存到数据库
          const records = apiMessages.map(msg => this.transformMessageToRecord(msg));
          databaseService.upsertMessages(records);
          messages = records;
        }

        total = messages.length;
      } else {
        // 数据库不可用，直接从API获取
        const apiMessages = await this.fetchMessagesFromAPI(chatId, limit);
        messages = apiMessages.map(msg => this.transformMessageToRecord(msg));
        total = messages.length;
      }

      return {
        messages: messages.map(record => this.transformRecordToMessage(record)),
        total,
        hasMore: messages.length === limit,
      };
    } catch (error) {
      console.error('[MessageService] Failed to get messages:', error);
      throw error;
    }
  }

  /**
   * 订阅聊天消息（注册WebSocket事件监听）
   */
  subscribeToMessages(chatId: string): void {
    if (this.subscribedChats.has(chatId)) {
      return;
    }

    this.subscribedChats.add(chatId);
    // WebSocket 事件监听在 setupWebSocketListeners 中统一处理
  }

  /**
   * 取消订阅聊天消息
   */
  unsubscribeFromMessages(chatId: string): void {
    this.subscribedChats.delete(chatId);
  }

  /**
   * 设置 WebSocket 事件监听器
   * 应该在 evolution-api.service 建立连接后调用
   */
  setupWebSocketListeners(): void {
    if (this.listenersSetup) {
      console.log('[MessageService] ⚠️ Listeners already setup, skipping');
      return;
    }

    console.log('[MessageService] 🎧 Setting up WebSocket listeners');
    // 监听新消息事件 (messages.upsert)
    this.evolutionService.on('messages.upsert', (...args: unknown[]) => {
      console.log('[MessageService] 🔔 Received messages.upsert event');
      const event = args[0] as MessagesUpsertEvent;
      this.handleMessagesUpsert(event);
    });

    // 监听消息状态更新事件 (messages.update)
    this.evolutionService.on('messages.update', (...args: unknown[]) => {
      const event = args[0] as MessagesUpdateEvent;
      this.handleMessagesUpdate(event);
    });

    this.listenersSetup = true;
    console.log('[MessageService] ✅ WebSocket listeners registered');
  }

  /**
   * 处理新消息事件 (messages.upsert)
   */
  private handleMessagesUpsert(event: MessagesUpsertEvent): void {
    console.log('[MessageService] 🎬 handleMessagesUpsert called');
    try {
      const { data } = event;
      console.log('[MessageService] 📦 Event data:', JSON.stringify(data, null, 2));

      // 类型检查：判断是新版本还是老版本数据结构
      let chatId: string;
      let messages: EvolutionMessage[];

      if ('key' in data) {
        // 新版本：单个消息对象
        chatId = data.key.remoteJid;
        messages = data.messages ?? [data as EvolutionMessage];
      } else {
        // 老版本：{ remoteJid, messages: [] }
        chatId = data.remoteJid;
        messages = data.messages || [];
      }

      if (!chatId) {
        console.error('[MessageService] Cannot extract chatId from message data:', data);
        return;
      }

      // 转换并存储消息
      const transformedMessages = messages.map(msg => this.transformEvolutionMessage(msg, chatId));

      // 保存到数据库
      if (MessageService.isDatabaseAvailable()) {
        const records = transformedMessages.map(msg => this.transformMessageToRecord(msg));
        databaseService.upsertMessages(records);
      }

      // 通知渲染进程
      if (this.mainWindow) {
        console.log('[MessageService] 📤 Sending to renderer:', chatId, transformedMessages.length);
        this.mainWindow.webContents.send('message:new', {
          chatId,
          messages: transformedMessages,
        });
      }
    } catch (error) {
      console.error('[MessageService] Error handling messages.upsert:', error);
    }
  }

  /**
   * 处理消息状态更新事件 (messages.update)
   */
  private handleMessagesUpdate(event: MessagesUpdateEvent): void {
    try {
      const { data } = event;

      data.forEach(update => {
        const { id, status } = update;
        const internalStatus = this.mapEvolutionStatus(status);

        // 更新数据库
        if (MessageService.isDatabaseAvailable()) {
          databaseService.updateMessageStatus(id, internalStatus);
        }

        // 通知渲染进程
        if (this.mainWindow) {
          this.mainWindow.webContents.send('message:status-update', {
            messageId: id,
            status: internalStatus,
          });
        }
      });
    } catch (error) {
      console.error('[MessageService] Error handling messages.update:', error);
    }
  }

  /**
   * 更新消息状态
   */
  // eslint-disable-next-line class-methods-use-this
  async updateMessageStatus(request: UpdateMessageStatusRequest): Promise<void> {
    const { messageId, status } = request;

    // 更新本地数据库
    if (MessageService.isDatabaseAvailable()) {
      databaseService.updateMessageStatus(messageId, status);
    }

    // TODO: 如果需要，也可以调用 Evolution API 更新远程状态
  }

  /**
   * 标记消息为已读
   */
  async markMessagesAsRead(request: MarkMessageReadRequest): Promise<void> {
    const { chatId, messageIds } = request;

    if (!this.currentInstanceName) {
      throw new Error('Instance name not set');
    }

    try {
      // 更新本地数据库
      if (MessageService.isDatabaseAvailable()) {
        databaseService.updateMessagesStatus(messageIds, MessageStatus.READ);
      }

      // 调用 Evolution API 标记已读
      await this.axiosInstance.post(
        `/message/markRead/${this.currentInstanceName}`,
        {
          readMessages: messageIds.map(id => ({
            id,
            remoteJid: chatId,
          })),
        },
      );
    } catch (error) {
      console.error('[MessageService] Failed to mark messages as read:', error);
      throw error;
    }
  }

  /**
   * 发送文本消息
   * @param chatId 聊天ID（手机号或群ID）
   * @param content 消息文本内容
   * @param instanceId Evolution API 实例名
   * @returns 包含临时ID和状态的Message对象
   */
  async sendTextMessage(chatId: string, content: string, instanceId: string): Promise<Message> {
    if (!instanceId) {
      throw new Error('Instance name not set');
    }

    try {
      // 1. 创建本地临时消息（乐观更新）
      const tempMessage: Message = {
        id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        chatId,
        senderId: 'me',
        senderName: '我',
        content,
        timestamp: Date.now(),
        status: MessageStatus.PENDING,
        type: MessageTypeEnum.TEXT,
        isGroupChat: chatId.includes('@g.us'),
        isOwn: true,
      };

      // 2. 保存到本地数据库（状态为 pending）
      if (MessageService.isDatabaseAvailable()) {
        const record = this.transformMessageToRecord(tempMessage);
        databaseService.upsertMessages([record]);
      }

      // 3. 调用 Evolution API 发送消息
      const response = await this.axiosInstance.post(
        `/message/sendText/${instanceId}`,
        {
          number: chatId,
          text: content,
        },
      );

      // 4. 检查响应数据
      if (!response.data) {
        throw new Error('Failed to send message: Invalid API response');
      }

      // 5. 提取 Evolution API 返回的 whatsappId
      const { key, messageTimestamp } = response.data;
      const whatsappId = key?.id || tempMessage.id;

      // 6. 更新消息状态和 whatsappId
      const sentMessage: Message = {
        ...tempMessage,
        id: whatsappId,
        timestamp: messageTimestamp ? messageTimestamp * 1000 : tempMessage.timestamp,
        status: MessageStatus.SENT,
      };

      // 7. 更新数据库中的消息
      if (MessageService.isDatabaseAvailable()) {
        // 删除临时消息
        databaseService.deleteMessage(tempMessage.id);
        // 插入新消息
        const record = this.transformMessageToRecord(sentMessage);
        databaseService.upsertMessages([record]);
      }

      console.log('[MessageService] ✅ Message sent successfully:', whatsappId);
      return sentMessage;
    } catch (error) {
      console.error('[MessageService] Failed to send message:', error);

      // 发送失败，创建失败消息记录
      const failedMessage: Message = {
        id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        chatId,
        senderId: 'me',
        senderName: '我',
        content,
        timestamp: Date.now(),
        status: MessageStatus.FAILED,
        type: MessageTypeEnum.TEXT,
        isGroupChat: chatId.includes('@g.us'),
        isOwn: true,
      };

      // 保存失败消息到数据库和失败队列
      if (MessageService.isDatabaseAvailable()) {
        const record = this.transformMessageToRecord(failedMessage);
        databaseService.upsertMessages([record]);

        // 保存到失败消息队列用于后续重试
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        databaseService.saveFailedMessage(failedMessage.id, chatId, content, errorMessage);
      }

      throw error;
    }
  }

  /**
   * 发送消息并支持指数退避重试
   * @param chatId 聊天ID
   * @param content 消息内容
   * @param instanceId Evolution API 实例名
   * @param maxRetries 最大重试次数（默认3次）
   * @returns 包含临时ID和状态的Message对象
   */
  async sendWithRetry(
    chatId: string,
    content: string,
    instanceId: string,
    maxRetries: number = 3,
  ): Promise<Message> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      try {
        // 第一次尝试直接发送，后续尝试添加延迟
        if (attempt > 0) {
          const delay = Math.min(1000 * 2 ** (attempt - 1), 4000); // 1s, 2s, 4s
          console.log(`[MessageService] Retrying send (attempt ${attempt}/${maxRetries}) after ${delay}ms`);
          // eslint-disable-next-line no-await-in-loop
          await new Promise(resolve => {
            setTimeout(resolve, delay);
          });
        }

        // 尝试发送消息
        // eslint-disable-next-line no-await-in-loop
        const message = await this.sendTextMessage(chatId, content, instanceId);
        console.log(`[MessageService] ✅ Message sent successfully on attempt ${attempt + 1}`);
        return message;
      } catch (error) {
        lastError = error as Error;
        console.error(`[MessageService] Send attempt ${attempt + 1} failed:`, error);

        // 如果已达到最大重试次数，抛出错误
        if (attempt === maxRetries) {
          console.error('[MessageService] ❌ All retry attempts failed');
          throw lastError;
        }
      }
    }

    // TypeScript类型检查需要这个
    throw lastError ?? new Error('Send failed with unknown error');
  }

  /**
   * 发送输入状态（typing indicator）
   * @param chatId 聊天ID
   * @param isTyping 是否正在输入
   * @param instanceId Evolution API 实例名
   */
  async sendTypingStatus(chatId: string, isTyping: boolean, instanceId: string): Promise<void> {
    if (!instanceId) {
      throw new Error('Instance name not set');
    }

    try {
      await this.axiosInstance.post(
        `/chat/sendPresence/${instanceId}`,
        {
          number: chatId,
          presence: isTyping ? 'composing' : 'paused',
        },
      );
      console.log(`[MessageService] Typing status sent: ${isTyping ? 'composing' : 'paused'}`);
    } catch (error) {
      console.error('[MessageService] Failed to send typing status:', error);
      // 不抛出错误，因为输入状态不是关键功能
    }
  }

  /**
   * 转换 Evolution API 消息为内部消息格式
   */
  private transformEvolutionMessage(msg: EvolutionMessage, chatId: string): Message {
    // 提取消息内容
    let content = '';
    let type: MessageType = MessageTypeEnum.TEXT;
    let metadata: MessageMetadata | undefined;

    // 支持临时消息（ephemeralMessage - 阅后即焚）
    let actualMessage = msg.message;
    if (msg.message.ephemeralMessage?.message) {
      actualMessage = msg.message.ephemeralMessage.message;
    }

    if (actualMessage.conversation) {
      content = actualMessage.conversation;
      type = MessageTypeEnum.TEXT;
    } else if (actualMessage.extendedTextMessage) {
      content = actualMessage.extendedTextMessage.text;
      type = MessageTypeEnum.TEXT;
    } else if (actualMessage.imageMessage) {
      content = actualMessage.imageMessage.caption ?? '[图片]';
      type = MessageTypeEnum.IMAGE;
      metadata = {
        mediaUrl: actualMessage.imageMessage.url,
        mimeType: actualMessage.imageMessage.mimetype,
        fileSize: actualMessage.imageMessage.fileSize,
        caption: actualMessage.imageMessage.caption,
      };
    } else if (actualMessage.videoMessage) {
      content = actualMessage.videoMessage.caption ?? '[视频]';
      type = MessageTypeEnum.VIDEO;
      metadata = {
        mediaUrl: actualMessage.videoMessage.url,
        mimeType: actualMessage.videoMessage.mimetype,
        fileSize: actualMessage.videoMessage.fileSize,
        duration: actualMessage.videoMessage.duration,
        caption: actualMessage.videoMessage.caption,
      };
    } else if (actualMessage.audioMessage) {
      content = '[语音消息]';
      type = MessageTypeEnum.AUDIO;
      metadata = {
        mediaUrl: actualMessage.audioMessage.url,
        mimeType: actualMessage.audioMessage.mimetype,
        fileSize: actualMessage.audioMessage.fileSize,
        duration: actualMessage.audioMessage.duration,
      };
    } else if (actualMessage.documentMessage) {
      content = `[文档] ${actualMessage.documentMessage.fileName}`;
      type = MessageTypeEnum.DOCUMENT;
      metadata = {
        mediaUrl: actualMessage.documentMessage.url,
        fileName: actualMessage.documentMessage.fileName,
        mimeType: actualMessage.documentMessage.mimetype,
        fileSize: actualMessage.documentMessage.fileSize,
      };
    }

    // 确定发送者信息
    const isOwn = msg.key.fromMe;
    const senderId = isOwn ? 'me' : msg.key.remoteJid;
    const senderName = isOwn ? '我' : (msg.pushName ?? '未知联系人');

    // 判断是否群聊
    const isGroupChat = chatId.includes('@g.us');

    return {
      id: msg.key.id,
      chatId,
      senderId,
      senderName,
      content,
      timestamp: msg.messageTimestamp * 1000, // 转换为毫秒
      status: this.mapEvolutionStatus(msg.status),
      type,
      isGroupChat,
      isOwn,
      metadata,
    };
  }

  /**
   * 转换消息为数据库记录
   */
  // eslint-disable-next-line class-methods-use-this
  private transformMessageToRecord(message: Message): MessageRecord {
    const now = Date.now();
    return {
      id: message.id,
      chat_id: message.chatId,
      sender_id: message.senderId,
      sender_name: message.senderName,
      sender_avatar: message.senderAvatar ?? null,
      content: message.content,
      timestamp: message.timestamp,
      status: message.status,
      type: message.type,
      is_group_chat: message.isGroupChat ? 1 : 0,
      is_own: message.isOwn ? 1 : 0,
      metadata: message.metadata ? JSON.stringify(message.metadata) : null,
      quoted_message: message.quotedMessage ? JSON.stringify(message.quotedMessage) : null,
      created_at: now,
      updated_at: now,
    };
  }

  /**
   * 转换数据库记录为消息
   */
  // eslint-disable-next-line class-methods-use-this
  private transformRecordToMessage(record: MessageRecord): Message {
    return {
      id: record.id,
      chatId: record.chat_id,
      senderId: record.sender_id,
      senderName: record.sender_name,
      senderAvatar: record.sender_avatar ?? undefined,
      content: record.content,
      timestamp: record.timestamp,
      status: record.status,
      type: record.type,
      isGroupChat: record.is_group_chat === 1,
      isOwn: record.is_own === 1,
      metadata: record.metadata ? JSON.parse(record.metadata) : undefined,
      quotedMessage: record.quoted_message ? JSON.parse(record.quoted_message) : undefined,
    };
  }

  /**
   * 映射 Evolution API 状态到内部状态
   */
  // eslint-disable-next-line class-methods-use-this
  private mapEvolutionStatus(
    status?: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED',
  ): MessageStatus {
    if (!status) {
      return MessageStatus.SENT;
    }

    switch (status) {
      case 'PENDING':
        return MessageStatus.PENDING;
      case 'SENT':
        return MessageStatus.SENT;
      case 'DELIVERED':
        return MessageStatus.DELIVERED;
      case 'READ':
        return MessageStatus.READ;
      case 'FAILED':
        return MessageStatus.FAILED;
      default:
        return MessageStatus.SENT;
    }
  }
}
