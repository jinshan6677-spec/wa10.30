// Evolution API 类型定义

/**
 * 连接状态枚举
 */
export enum ConnectionStatus {
  INITIALIZING = 'initializing', // 初始化中
  DISCONNECTED = 'disconnected', // 未连接
  CONNECTING = 'connecting', // 连接中
  QR_CODE_READY = 'qr_code_ready', // 二维码已生成
  CONNECTED = 'connected', // 已连接
  ERROR = 'error', // 错误状态
}

/**
 * 连接状态数据
 */
export interface ConnectionState {
  status: ConnectionStatus;
  instanceKey: string | null;
  phoneNumber: string | null;        // ✅ 新增：绑定的手机号
  qrCode: string | null;
  error: Error | null;
  lastConnected: Date | null;
  reconnectAttempts: number;
  sessionValid: boolean;             // ✅ 新增：会话有效性标记
}

/**
 * Evolution API配置
 */
export interface EvolutionAPIConfig {
  baseURL: string;
  apiKey: string;
  instancePrefix?: string;
  timeout?: number;
}

/**
 * Evolution API 实例信息
 */
export interface EvolutionInstance {
  instanceName: string;
  status: string;
  serverUrl?: string;
  apikey?: string;
}

/**
 * 实例设置配置 (基于 Evolution API 最佳实践)
 */
export interface InstanceSettings {
  // 历史同步优化
  sync_full_history?: boolean;      // 是否同步完整历史 (false = 更快连接)
  sync_messages_count?: number;     // 同步消息数量 (建议20-50)

  // 媒体处理
  auto_download_media?: boolean;    // 是否自动下载媒体

  // 在线状态
  always_online?: boolean;          // 始终在线
  read_messages?: boolean;          // 自动标记消息已读
  read_status?: boolean;            // 自动标记状态已读

  // 群组配置
  groups_ignore?: boolean;          // 忽略群组消息
}

/**
 * 创建实例请求
 */
export interface CreateInstanceRequest {
  instanceName: string;
  token?: string;
  qrcode?: boolean;
  number?: string;
  integration?: string;
  webhookUrl?: string;

  // 性能优化参数
  reject_call?: boolean;          // 自动拒绝来电
  websocket_enabled?: boolean;    // 启用WebSocket
  websocket_events?: string[];    // WebSocket事件订阅列表

  // 🔥 新增: 实例设置 (性能优化关键)
  settings?: InstanceSettings;
}

/**
 * 创建实例响应
 */
export interface CreateInstanceResponse {
  instance: EvolutionInstance;
  hash?: {
    apikey: string;
  };
  qrcode?: QRCodeResponse;
}

/**
 * 二维码响应
 */
export interface QRCodeResponse {
  base64?: string;
  code?: string;
  pairingCode?: string;
}

/**
 * 获取二维码响应
 */
export interface GetQRCodeResponse {
  pairingCode?: string;
  code?: string;
  base64?: string;
}

/**
 * 连接状态更新事件
 */
export interface ConnectionUpdateEvent {
  instance: string;
  state: 'open' | 'close' | 'connecting';
  statusReason?: number;
  user?: {                           // ✅ 新增：用户信息（连接成功后返回）
    id: string;
    name?: string;
    phoneNumber?: string;
  };
}

/**
 * 二维码更新事件
 */
export interface QRCodeUpdateEvent {
  event: string;
  instance: string;
  data: {
    base64?: string;
    code?: string;
    pairingCode?: string;
    count?: number;
  };
  server_url: string;
  date_time: string;
  apikey: string;
}

/**
 * WebSocket 事件类型
 */
export type EvolutionWebSocketEvent =
  | 'connection.update'
  | 'qrcode.updated'
  | 'messages.upsert'
  | 'messages.update'
  | 'messages.delete';

/**
 * WebSocket 事件数据
 */
export interface WebSocketEventData<T = unknown> {
  event: EvolutionWebSocketEvent;
  instance: string;
  data: T;
}

/**
 * Evolution API 错误
 */
export interface EvolutionAPIError {
  code: string;
  message: string;
  status?: number;
  details?: unknown;
}

/**
 * 重连配置
 */
export interface ReconnectConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  timeout: number;
}

/**
 * 实例连接选项
 */
export interface ConnectOptions {
  reconnect?: boolean;
  reconnectConfig?: Partial<ReconnectConfig>;
}

/**
 * 断开连接选项
 */
export interface DisconnectOptions {
  logout?: boolean;
  removeInstance?: boolean;
}

/**
 * WebSocket 断开连接事件数据
 */
export interface WebSocketDisconnectedEvent {
  reason?: string;
  code?: number;
}

/**
 * WebSocket 错误事件数据
 */
export interface WebSocketErrorEvent {
  error: Error | string;
  message?: string;
}

/**
 * 重连尝试事件数据
 */
export interface ReconnectAttemptEvent {
  attempt: number;
  delay: number;
  nextAttemptIn?: number;
}

/**
 * Evolution API 消息结构
 */
export interface EvolutionMessage {
  key: {
    id: string; // 消息唯一ID
    remoteJid: string; // 聊天ID (例: 5511999999999@s.whatsapp.net)
    fromMe: boolean; // 是否是我发送的
  };
  message: {
    conversation?: string; // 文本消息内容
    extendedTextMessage?: {
      text: string;
    };
    // 临时消息（阅后即焚）
    ephemeralMessage?: {
      message: {
        conversation?: string;
        extendedTextMessage?: {
          text: string;
        };
        imageMessage?: {
          url: string;
          mimetype: string;
          caption?: string;
          fileSize?: number;
        };
        videoMessage?: {
          url: string;
          mimetype: string;
          caption?: string;
          fileSize?: number;
          duration?: number;
        };
        audioMessage?: {
          url: string;
          mimetype: string;
          fileSize?: number;
          duration?: number;
        };
        documentMessage?: {
          url: string;
          mimetype: string;
          fileName: string;
          fileSize?: number;
        };
      };
    };
    imageMessage?: {
      url: string;
      mimetype: string;
      caption?: string;
      fileSize?: number;
    };
    videoMessage?: {
      url: string;
      mimetype: string;
      caption?: string;
      fileSize?: number;
      duration?: number;
    };
    audioMessage?: {
      url: string;
      mimetype: string;
      fileSize?: number;
      duration?: number;
    };
    documentMessage?: {
      url: string;
      mimetype: string;
      fileName: string;
      fileSize?: number;
    };
  };
  messageTimestamp: number; // Unix时间戳（秒）
  pushName?: string; // 发送者显示名称
  status?: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'; // 消息状态
}

/**
 * messages.upsert 事件数据 (新消息)
 * 支持两种结构：
 * 1. 老版本: { remoteJid, messages: [] }
 * 2. 新版本: 直接是单个消息对象（带有key.remoteJid）
 */
export interface MessagesUpsertEvent {
  instance: string; // 实例名称
  data: (
    | {
        remoteJid: string; // 聊天ID
        messages: EvolutionMessage[]; // 新消息列表
      }
    | (EvolutionMessage & { messages?: EvolutionMessage[] }) // 新版本：单个消息对象
  );
  server_url: string;
  date_time: string;
  apikey: string;
}

/**
 * messages.update 事件数据 (消息状态更新)
 */
export interface MessagesUpdateEvent {
  instance: string; // 实例名称
  data: {
    remoteJid: string; // 聊天ID
    id: string; // 消息ID
    status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'; // 新状态
  }[];
  server_url: string;
  date_time: string;
  apikey: string;
}

/**
 * Evolution API REST - 获取消息历史请求参数
 */
export interface GetMessagesHistoryRequest {
  chatId: string; // 聊天ID (remoteJid格式)
  limit?: number; // 限制数量 (默认50)
  offset?: number; // 偏移量
}

/**
 * Evolution API REST - 获取消息历史响应
 */
export interface GetMessagesHistoryResponse {
  messages: EvolutionMessage[];
  count: number;
}

/**
 * Evolution API REST - 标记消息已读请求参数
 */
export interface MarkMessageReadRequest {
  readMessages: Array<{
    id: string; // 消息ID
    remoteJid: string; // 聊天ID
  }>;
}
