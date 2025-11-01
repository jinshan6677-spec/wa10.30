import { randomUUID } from 'crypto';

import type { BrowserWindow } from 'electron';

import type {
  Chat,
  ChatRecord,
  ContactInfo,
  GetChatsRequest,
  GetChatsResponse,
  UpdateChatRequest,
  MessageStatus,
  EvolutionChatResponse,
  EvolutionContactResponse,
} from '../../shared/types/chat.types';

import { databaseService } from './database.service';
import type { EvolutionAPIService } from './evolution-api.service';

/**
 * 聊天服务类
 * 负责管理聊天列表数据、缓存策略和Evolution API集成
 */
export class ChatService {
  private evolutionService: EvolutionAPIService;

  private mainWindow: BrowserWindow | null = null;

  private currentInstanceName: string | null = null;

  constructor(evolutionService: EvolutionAPIService) {
    this.evolutionService = evolutionService;

    // 数据库初始化将延迟到实际使用时（确保 app.ready 已触发）
  }

  /**
   * 确保数据库已初始化
   * @returns true if database is available, false otherwise
   */
  private static async ensureDatabase(): Promise<boolean> {
    try {
      databaseService.getDatabase();
      return true;
    } catch {
      // 数据库未初始化,现在初始化
      const success = await databaseService.initialize();
      return success;
    }
  }

  /**
   * Check if database is available
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
   * 从 Evolution API 获取聊天列表
   */
  async fetchChatsFromAPI(instanceName: string): Promise<EvolutionChatResponse[]> {
    try {
      // Evolution API v2.3.6 /chat/findChats返回的是数组,不是对象
      const response = await this.evolutionService.getChats(instanceName);
      const chats = Array.isArray(response) ? response : [];
      console.log('[ChatService] Fetched chats from API:', chats.length);
      return chats as EvolutionChatResponse[];
    } catch (error) {
      console.error('[ChatService] Failed to fetch chats from API:', error);
      throw error;
    }
  }

  /**
   * 从 Evolution API 获取联系人信息
   */
  async fetchContactInfo(
    instanceName: string,
    whatsappId: string,
  ): Promise<EvolutionContactResponse | null> {
    try {
      // 🔥 修复：使用正确的公共方法，移除 `as any` 黑魔法
      const response = await this.evolutionService.getContactInfo(instanceName, whatsappId);
      return response as EvolutionContactResponse;
    } catch (error) {
      console.error('[ChatService] Failed to fetch contact info:', error);
      return null;
    }
  }

  /**
   * 转换 Evolution API 聊天数据为本地 Chat 格式
   */
  private static convertEvolutionChatToChat(evolutionChat: EvolutionChatResponse): Chat {
    const now = Date.now();
    const messageTimestamp = evolutionChat.lastMessage?.messageTimestamp
      ? evolutionChat.lastMessage.messageTimestamp * 1000
      : now;

    // 提取消息内容
    let messageContent = '';
    if (evolutionChat.lastMessage?.message) {
      const msg = evolutionChat.lastMessage.message;
      messageContent = msg.conversation ?? msg.extendedTextMessage?.text ?? '';
    }

    // 提取联系人名称(优先使用pushName,否则使用name或remoteJid)
    // 注意：WhatsApp API可能不总是提供pushName(隐私保护)
    const contactName = evolutionChat.pushName ?? evolutionChat.name ?? evolutionChat.remoteJid;

    return {
      id: randomUUID(),
      whatsappId: evolutionChat.remoteJid,
      name: contactName,
      avatarUrl: evolutionChat.profilePicUrl ?? undefined,
      lastMessage: {
        content: messageContent,
        timestamp: new Date(messageTimestamp),
        senderId: evolutionChat.lastMessage?.key.remoteJid ?? '',
        status: (evolutionChat.lastMessage?.status as MessageStatus) ?? 'delivered',
        isFromMe: evolutionChat.lastMessage?.key.fromMe ?? false,
      },
      unreadCount: evolutionChat.unreadCount ?? 0,
      isPinned: evolutionChat.pinned ?? false,
      isArchived: evolutionChat.archived ?? false,
      isGroup: evolutionChat.isGroup,
      isOnline: undefined, // WhatsApp API不提供实时在线状态
      lastSeenAt: undefined, // WhatsApp API不提供最后上线时间(隐私保护)
      createdAt: new Date(evolutionChat.timestamp ?? now),
      updatedAt: evolutionChat.updatedAt ? new Date(evolutionChat.updatedAt) : new Date(now),
    };
  }

  /**
   * 转换 Chat 为 ChatRecord（数据库格式）
   */
  private static convertChatToRecord(chat: Chat): ChatRecord {
    return {
      id: chat.id,
      whatsapp_id: chat.whatsappId,
      name: chat.name,
      avatar_url: chat.avatarUrl ?? null,
      last_message: chat.lastMessage.content,
      last_message_time: chat.lastMessage.timestamp.getTime(),
      last_message_sender: chat.lastMessage.senderId,
      last_message_status: chat.lastMessage.status,
      last_message_is_from_me: chat.lastMessage.isFromMe ? 1 : 0,
      unread_count: chat.unreadCount,
      is_pinned: chat.isPinned ? 1 : 0,
      is_archived: chat.isArchived ? 1 : 0,
      is_group: chat.isGroup ? 1 : 0,
      is_online: chat.isOnline !== undefined ? Number(chat.isOnline) : null,
      last_seen_at: chat.lastSeenAt ? chat.lastSeenAt.getTime() : null,
      created_at: chat.createdAt.getTime(),
      updated_at: chat.updatedAt.getTime(),
    };
  }

  /**
   * 转换 ChatRecord 为 Chat（应用格式）
   */
  private static convertRecordToChat(record: ChatRecord): Chat {
    return {
      id: record.id,
      whatsappId: record.whatsapp_id,
      name: record.name,
      avatarUrl: record.avatar_url ?? undefined,
      lastMessage: {
        content: record.last_message,
        timestamp: new Date(record.last_message_time),
        senderId: record.last_message_sender,
        status: record.last_message_status,
        isFromMe: record.last_message_is_from_me === 1,
      },
      unreadCount: record.unread_count,
      isPinned: record.is_pinned === 1,
      isArchived: record.is_archived === 1,
      isGroup: record.is_group === 1,
      isOnline: record.is_online !== null ? record.is_online === 1 : undefined,
      lastSeenAt: record.last_seen_at ? new Date(record.last_seen_at) : undefined,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    };
  }

  /**
   * 同步聊天列表（从API获取并缓存到数据库）
   */
  async syncChats(instanceName: string): Promise<void> {
    try {
      console.log('[ChatService] Starting chat sync for instance:', instanceName);

      // 尝试初始化数据库
      const dbAvailable = await ChatService.ensureDatabase();

      // 从 API 获取聊天列表
      const evolutionChats = await this.fetchChatsFromAPI(instanceName);

      // 转换为本地格式
      const chats = evolutionChats.map(ec => ChatService.convertEvolutionChatToChat(ec));

      if (dbAvailable) {
        // 转换为数据库记录格式
        const chatRecords = chats.map(chat => ChatService.convertChatToRecord(chat));

        // 批量更新到数据库
        databaseService.upsertChats(chatRecords);
        console.log('[ChatService] Chat sync completed (cached):', chatRecords.length, 'chats');
      } else {
        console.log('[ChatService] Chat sync completed (no cache):', chats.length, 'chats');
      }

      // 通知渲染进程聊天列表已更新
      if (this.mainWindow) {
        this.mainWindow.webContents.send('chat:list-updated', chats);
      }
    } catch (error) {
      console.error('[ChatService] Failed to sync chats:', error);
      throw error;
    }
  }

  /**
   * 获取聊天列表（从缓存或API）
   */
  // eslint-disable-next-line class-methods-use-this
  async getChats(request: GetChatsRequest = {}): Promise<GetChatsResponse> {
    try {
      const { includeArchived = false, limit, offset = 0 } = request;

      let chats: Chat[] = [];

      // 尝试从数据库获取
      if (ChatService.isDatabaseAvailable()) {
        // 从数据库获取聊天列表
        const allChats = databaseService.getAllChats(includeArchived);
        // 转换为应用格式
        chats = allChats.map(record => ChatService.convertRecordToChat(record));
        console.log('[ChatService] Loaded', chats.length, 'chats from database');
      } else {
        // 数据库不可用，返回空列表（前端会通过syncChats从API获取）
        console.warn(
          '[ChatService] Database not available, returning empty list. Use syncChats to fetch from API.',
        );
        chats = [];
      }

      // 应用分页
      const paginatedChats = limit ? chats.slice(offset, offset + limit) : chats;
      const hasMore = limit ? offset + limit < chats.length : false;

      return {
        chats: paginatedChats,
        total: chats.length,
        hasMore,
      };
    } catch (error) {
      console.error('[ChatService] Failed to get chats:', error);
      throw error;
    }
  }

  /**
   * 获取联系人信息
   */
  async getContactInfo(whatsappId: string): Promise<ContactInfo | null> {
    if (!this.currentInstanceName) {
      throw new Error('Instance name not set');
    }

    try {
      const evolutionContact = await this.fetchContactInfo(this.currentInstanceName, whatsappId);
      if (!evolutionContact) {
        return null;
      }

      return {
        id: randomUUID(),
        whatsappId: evolutionContact.id,
        name: evolutionContact.pushName ?? evolutionContact.id,
        avatarUrl: evolutionContact.profilePictureUrl,
        phoneNumber: evolutionContact.id.replace('@s.whatsapp.net', ''),
        isOnline: evolutionContact.isOnline ?? false,
        lastSeenAt: evolutionContact.lastSeen
          ? new Date(evolutionContact.lastSeen * 1000)
          : undefined,
        status: undefined,
      };
    } catch (error) {
      console.error('[ChatService] Failed to get contact info:', error);
      return null;
    }
  }

  /**
   * 搜索聊天
   */
  // eslint-disable-next-line class-methods-use-this
  async searchChats(query: string, limit: number = 50): Promise<Chat[]> {
    try {
      // 确保数据库已初始化
      await ChatService.ensureDatabase();

      const chatRecords = databaseService.searchChats(query, limit);
      return chatRecords.map(record => ChatService.convertRecordToChat(record));
    } catch (error) {
      console.error('[ChatService] Failed to search chats:', error);
      throw error;
    }
  }

  /**
   * 更新聊天状态（置顶/归档）
   */
  async updateChat(request: UpdateChatRequest): Promise<void> {
    const { whatsappId, isPinned, isArchived } = request;

    if (!this.currentInstanceName) {
      throw new Error('Instance name not set');
    }

    try {
      // 确保数据库已初始化
      await ChatService.ensureDatabase();

      if (isPinned !== undefined) {
        databaseService.updateChatPinned(whatsappId, isPinned);

        // 🔥 修复：实现 Evolution API 同步置顶状态
        await this.evolutionService.updateChatPinned(
          this.currentInstanceName,
          whatsappId,
          isPinned,
        );
      }

      if (isArchived !== undefined) {
        databaseService.updateChatArchived(whatsappId, isArchived);

        // 🔥 修复：实现 Evolution API 同步归档状态
        await this.evolutionService.updateChatArchived(
          this.currentInstanceName,
          whatsappId,
          isArchived,
        );
      }

      // 通知渲染进程聊天已更新
      if (this.mainWindow) {
        const updatedChat = databaseService.getChatByWhatsappId(whatsappId);
        if (updatedChat) {
          this.mainWindow.webContents.send('chat:updated', ChatService.convertRecordToChat(updatedChat));
        }
      }

      console.log('[ChatService] Chat updated:', whatsappId);
    } catch (error) {
      console.error('[ChatService] Failed to update chat:', error);
      throw error;
    }
  }

  /**
   * 清理服务
   */
  // eslint-disable-next-line class-methods-use-this
  cleanupService(): void {
    databaseService.close();
    console.log('[ChatService] Service destroyed');
  }
}
