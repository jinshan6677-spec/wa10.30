/**
 * Electron API 类型定义
 * 定义主进程暴露给渲染进程的 API 接口
 */

import type {
  GetChatsRequest,
  GetChatsResponse,
  ContactInfo,
  Chat,
  UpdateChatRequest,
  IPCResponse,
} from './chat.types';
import type {
  GetMessagesRequest,
  GetMessagesResponse,
  MarkMessageReadRequest,
  UpdateMessageStatusRequest,
  Message,
} from './message.types';

/**
 * Evolution API 接口
 */
export interface EvolutionAPIBridge {
  createInstance: (instanceName: string) => Promise<any>;
  getQRCode: (instanceName: string) => Promise<any>;
  getConnectionStatus: (instanceName: string) => Promise<any>;
  disconnect: (instanceName: string, options?: any) => Promise<void>;
  connectWebSocket: (instanceName: string) => Promise<void>;
  disconnectWebSocket: () => Promise<void>;
}

/**
 * Chat API 接口
 */
export interface ChatAPIBridge {
  syncChats: (instanceName: string) => Promise<IPCResponse<void>>;
  getChats: (request?: GetChatsRequest) => Promise<IPCResponse<GetChatsResponse>>;
  getContactInfo: (whatsappId: string) => Promise<IPCResponse<ContactInfo | null>>;
  searchChats: (query: string, limit?: number) => Promise<IPCResponse<Chat[]>>;
  updateChat: (request: UpdateChatRequest) => Promise<IPCResponse<void>>;
}

/**
 * 发送消息请求参数
 */
export interface SendMessageParams {
  chatId: string;
  content: string;
  instanceId: string;
}

/**
 * 发送输入状态请求参数
 */
export interface SendTypingStatusParams {
  chatId: string;
  isTyping: boolean;
  instanceId: string;
}

/**
 * Message API 接口
 */
export interface MessageAPIBridge {
  getMessages: (request: GetMessagesRequest) => Promise<IPCResponse<GetMessagesResponse>>;
  subscribe: (chatId: string) => Promise<IPCResponse<void>>;
  unsubscribe: (chatId: string) => Promise<IPCResponse<void>>;
  markAsRead: (request: MarkMessageReadRequest) => Promise<IPCResponse<void>>;
  updateStatus: (request: UpdateMessageStatusRequest) => Promise<IPCResponse<void>>;
  setInstance: (instanceName: string) => Promise<IPCResponse<void>>;
  sendMessage: (params: SendMessageParams) => Promise<IPCResponse<Message>>;
  sendTypingStatus: (params: SendTypingStatusParams) => Promise<IPCResponse<void>>;
  // 测试端点
  simulateMessage: (chatId: string) => Promise<{ success: boolean; message?: any; error?: string }>;
}

/**
 * Electron API 主接口
 * 通过 contextBridge 暴露给渲染进程
 */
export interface ElectronAPI {
  // 应用信息
  getVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;

  // 窗口控制
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;

  // 对话框
  showMessageBox: (options: Electron.MessageBoxOptions) => Promise<Electron.MessageBoxReturnValue>;

  // 外部链接
  openExternal: (url: string) => Promise<void>;

  // Evolution API - WhatsApp 连接
  evolutionAPI: EvolutionAPIBridge;

  // Chat API - 聊天列表和联系人管理
  chatAPI: ChatAPIBridge;

  // Message API - 消息收发和管理
  messageAPI: MessageAPIBridge;

  // 事件监听
  on: (channel: string, callback: (...args: any[]) => void) => void;
  off: (channel: string, callback: (...args: any[]) => void) => void;
  removeAllListeners: (channel: string) => void;
}
