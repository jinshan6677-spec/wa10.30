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
  qrCode: string | null;
  error: Error | null;
  lastConnected: Date | null;
  reconnectAttempts: number;
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
 * 创建实例请求
 */
export interface CreateInstanceRequest {
  instanceName: string;
  token?: string;
  qrcode?: boolean;
  number?: string;
  integration?: string;
  webhookUrl?: string;
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
