// 聊天数据类型定义

/**
 * 消息状态枚举
 */
export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  PENDING = 'pending',
  FAILED = 'failed',
}

/**
 * 在线状态枚举
 */
export enum OnlineStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  AWAY = 'away',
  UNKNOWN = 'unknown',
}

/**
 * 聊天数据结构
 */
export interface Chat {
  id: string; // 本地数据库ID
  whatsappId: string; // WhatsApp聊天ID
  name: string; // 联系人/群组名称
  avatarUrl?: string; // 头像URL
  lastMessage: LastMessage;
  unreadCount: number; // 未读消息数量
  isPinned: boolean; // 是否置顶
  isArchived: boolean; // 是否归档
  isGroup: boolean; // 是否群组
  isOnline?: boolean; // 在线状态（仅单人聊天）
  lastSeenAt?: Date; // 最后上线时间
  createdAt: Date; // 创建时间
  updatedAt: Date; // 更新时间
}

/**
 * 最新消息结构
 */
export interface LastMessage {
  content: string; // 最新消息内容
  timestamp: Date; // 消息时间
  senderId: string; // 发送者ID
  status: MessageStatus; // 消息状态
  isFromMe: boolean; // 是否是我发送的
}

/**
 * 联系人信息结构
 */
export interface ContactInfo {
  id: string;
  whatsappId: string;
  name: string;
  avatarUrl?: string;
  phoneNumber: string;
  isOnline: boolean;
  lastSeenAt?: Date;
  status?: string; // 个性签名
}

/**
 * Evolution API 聊天响应（根据Evolution API v2.3.6实际返回结构）
 */
export interface EvolutionChatResponse {
  id: string;
  remoteJid: string; // WhatsApp ID
  name?: string;
  pushName?: string | null; // 联系人显示名称
  profilePicUrl?: string | null; // 头像URL
  isGroup: boolean;
  timestamp?: number;
  unreadCount?: number | null;
  lastMessage?: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    message: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
    };
    messageTimestamp: number;
    status?: string; // 消息状态: PENDING, SENT, DELIVERED, READ
  };
  pinned?: boolean;
  archived?: boolean;
  updatedAt?: string; // ISO timestamp
}

/**
 * Evolution API 联系人响应
 */
export interface EvolutionContactResponse {
  id: string;
  pushName?: string;
  profilePictureUrl?: string;
  isOnline?: boolean;
  lastSeen?: number;
}

/**
 * 数据库聊天记录结构（SQLite）
 */
export interface ChatRecord {
  id: string;
  whatsapp_id: string;
  name: string;
  avatar_url: string | null;
  last_message: string;
  last_message_time: number; // Unix timestamp
  last_message_sender: string;
  last_message_status: MessageStatus;
  last_message_is_from_me: number; // SQLite boolean (0/1)
  unread_count: number;
  is_pinned: number; // SQLite boolean (0/1)
  is_archived: number; // SQLite boolean (0/1)
  is_group: number; // SQLite boolean (0/1)
  is_online: number | null; // SQLite boolean (0/1)
  last_seen_at: number | null; // Unix timestamp
  created_at: number; // Unix timestamp
  updated_at: number; // Unix timestamp
}

/**
 * 获取聊天列表请求参数
 */
export interface GetChatsRequest {
  includeArchived?: boolean; // 是否包含归档聊天
  limit?: number; // 限制数量
  offset?: number; // 偏移量
}

/**
 * 获取聊天列表响应
 */
export interface GetChatsResponse {
  chats: Chat[];
  total: number;
  hasMore: boolean;
}

/**
 * 更新聊天请求参数
 */
export interface UpdateChatRequest {
  whatsappId: string;
  isPinned?: boolean;
  isArchived?: boolean;
}

/**
 * IPC 响应包装
 */
export interface IPCResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
