// 消息数据类型定义

import { MessageStatus } from './chat.types';

/**
 * 消息类型枚举
 */
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  STICKER = 'sticker',
  LOCATION = 'location',
  CONTACT = 'contact',
}

/**
 * 消息数据结构
 */
export interface Message {
  id: string; // 消息唯一ID
  chatId: string; // 所属聊天ID
  senderId: string; // 发送者ID
  senderName: string; // 发送者名称
  senderAvatar?: string; // 发送者头像URL
  content: string; // 消息内容
  timestamp: number; // Unix时间戳（毫秒）
  status: MessageStatus; // 消息状态
  type: MessageType; // 消息类型
  isGroupChat: boolean; // 是否群聊消息
  isOwn: boolean; // 是否是自己发送的
  metadata?: MessageMetadata; // 额外元数据
  quotedMessage?: QuotedMessage; // 引用/回复的消息
}

/**
 * 消息元数据
 */
export interface MessageMetadata {
  mediaUrl?: string; // 媒体文件URL（图片、视频、音频）
  thumbnailUrl?: string; // 缩略图URL
  fileName?: string; // 文件名称
  fileSize?: number; // 文件大小（字节）
  mimeType?: string; // MIME类型
  duration?: number; // 音视频时长（秒）
  latitude?: number; // 位置纬度
  longitude?: number; // 位置经度
  caption?: string; // 媒体描述文字
}

/**
 * 引用消息结构
 */
export interface QuotedMessage {
  id: string; // 被引用消息的ID
  content: string; // 被引用消息的内容
  senderName: string; // 被引用消息的发送者
}

/**
 * 获取消息列表请求参数
 */
export interface GetMessagesRequest {
  chatId: string; // 聊天ID
  limit?: number; // 限制数量（默认50）
  offset?: number; // 偏移量
  beforeTimestamp?: number; // 获取此时间戳之前的消息（用于历史消息分页）
}

/**
 * 获取消息列表响应
 */
export interface GetMessagesResponse {
  messages: Message[];
  total: number;
  hasMore: boolean; // 是否还有更多消息
}

/**
 * 发送消息请求参数
 */
export interface SendMessageRequest {
  chatId: string; // 目标聊天ID
  content: string; // 消息内容
  type?: MessageType; // 消息类型（默认TEXT）
  quotedMessageId?: string; // 引用的消息ID
  metadata?: Partial<MessageMetadata>; // 元数据（媒体消息）
}

/**
 * 标记消息已读请求参数
 */
export interface MarkMessageReadRequest {
  chatId: string; // 聊天ID
  messageIds: string[]; // 要标记的消息ID列表
}

/**
 * 更新消息状态请求参数
 */
export interface UpdateMessageStatusRequest {
  messageId: string; // 消息ID
  status: MessageStatus; // 新状态
}

/**
 * 数据库消息记录结构（SQLite）
 */
export interface MessageRecord {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string | null;
  content: string;
  timestamp: number; // Unix timestamp (ms)
  status: MessageStatus;
  type: MessageType;
  is_group_chat: number; // SQLite boolean (0/1)
  is_own: number; // SQLite boolean (0/1)
  metadata: string | null; // JSON string
  quoted_message: string | null; // JSON string
  created_at: number; // Unix timestamp (ms)
  updated_at: number; // Unix timestamp (ms)
}

/**
 * 消息状态映射函数
 * 将 Evolution API 的消息状态映射为内部 MessageStatus 枚举
 */
export function mapEvolutionStatusToMessageStatus(
  evolutionStatus?: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED',
): MessageStatus {
  if (!evolutionStatus) {
    return MessageStatus.SENT;
  }

  switch (evolutionStatus) {
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
