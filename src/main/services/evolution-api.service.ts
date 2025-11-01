import type { AxiosInstance, AxiosError } from 'axios';
import axios from 'axios';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';

import type {
  EvolutionAPIConfig,
  CreateInstanceRequest,
  CreateInstanceResponse,
  GetQRCodeResponse,
  ConnectionUpdateEvent,
  EvolutionAPIError,
  ReconnectConfig,
  ConnectOptions,
  DisconnectOptions,
} from '../../shared/types/evolution-api.types';

/**
 * Evolution API 服务类
 * 封装 Evolution API 的 REST 和 WebSocket 通信
 */
export class EvolutionAPIService {
  private axiosInstance: AxiosInstance;

  private socket: Socket | null = null;

  private config: EvolutionAPIConfig;

  private reconnectConfig: ReconnectConfig = {
    maxAttempts: 5,
    baseDelay: 500,   // 减少到500ms（原1000ms）- 加快重连速度
    maxDelay: 5000,   // 减少到5秒（原30秒）- 避免长时间等待
    timeout: 15000,   // 减少到15秒（原30秒）- 加快超时反馈
  };

  private reconnectAttempts = 0;

  private reconnectTimer: NodeJS.Timeout | null = null;

  private eventHandlers: Map<string, Set<(...args: unknown[]) => void>> = new Map();

  private currentInstanceName: string | null = null;

  constructor(config: EvolutionAPIConfig) {
    this.config = {
      instancePrefix: 'whatsapp_',
      timeout: 30000,
      ...config,
    };

    // 创建 axios 实例
    this.axiosInstance = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        apikey: this.config.apiKey,
      },
    });

    // 添加请求拦截器（静默模式，仅记录错误）
    this.axiosInstance.interceptors.request.use(
      axiosConfig => axiosConfig,
      error => {
        console.error('[Evolution API] Request error:', error);
        return Promise.reject(error);
      },
    );

    // 添加响应拦截器（静默模式，仅记录错误）
    this.axiosInstance.interceptors.response.use(
      response => response,
      (error: AxiosError) => {
        const evolutionError = this.handleAPIError(error);
        console.error('[Evolution API] Response error:', evolutionError);
        return Promise.reject(evolutionError);
      },
    );
  }

  /**
   * 创建 WhatsApp 实例
   */
  async createInstance(request: CreateInstanceRequest): Promise<CreateInstanceResponse> {
    try {
      const response = await this.axiosInstance.post<CreateInstanceResponse>('/instance/create', {
        instanceName: request.instanceName,
        token: request.token,
        qrcode: request.qrcode !== false, // 默认 true
        number: request.number,
        integration: request.integration,
        webhook: request.webhookUrl,
        // 性能优化参数
        reject_call: request.reject_call,
        websocket_enabled: request.websocket_enabled,
        websocket_events: request.websocket_events,
      });

      return response.data;
    } catch (error) {
      const evolutionError = this.handleAPIError(error as AxiosError);
      throw new Error(evolutionError.message);
    }
  }

  /**
   * 获取二维码
   */
  async getQRCode(instanceName: string): Promise<GetQRCodeResponse> {
    try {
      const response = await this.axiosInstance.get<GetQRCodeResponse>(
        `/instance/connect/${instanceName}`,
      );

      return response.data;
    } catch (error) {
      const evolutionError = this.handleAPIError(error as AxiosError);
      throw new Error(evolutionError.message);
    }
  }

  /**
   * 获取实例连接状态
   */
  async getConnectionStatus(instanceName: string): Promise<{ state: string }> {
    try {
      const response = await this.axiosInstance.get<{ state: string }>(
        `/instance/connectionState/${instanceName}`,
      );

      return response.data;
    } catch (error) {
      const evolutionError = this.handleAPIError(error as AxiosError);
      throw new Error(evolutionError.message);
    }
  }

  /**
   * 检查实例是否存在
   */
  async instanceExists(instanceName: string): Promise<boolean> {
    try {
      await this.getConnectionStatus(instanceName);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 断开实例连接
   */
  async disconnect(instanceName: string, options?: DisconnectOptions): Promise<void> {
    try {
      if (options?.logout) {
        await this.axiosInstance.delete(`/instance/logout/${instanceName}`);
      }

      if (options?.removeInstance) {
        await this.axiosInstance.delete(`/instance/delete/${instanceName}`);
      }
    } catch (error) {
      const evolutionError = this.handleAPIError(error as AxiosError);
      throw new Error(evolutionError.message);
    }
  }

  /**
   * 连接 WebSocket (全局模式)
   * Evolution API v2全局WebSocket模式：连接到基础URL，接收所有实例的事件
   */
  connectWebSocket(instanceName: string, options?: ConnectOptions): void {
    if (this.socket?.connected) {
      console.warn('[Evolution API] WebSocket already connected');
      return;
    }

    // 合并重连配置
    if (options?.reconnectConfig) {
      this.reconnectConfig = { ...this.reconnectConfig, ...options?.reconnectConfig };
    }

    // 全局WebSocket模式：连接到基础URL（不包含实例名）
    const socketURL = this.config.baseURL;
    console.log('[Evolution API] Connecting to Global WebSocket:', socketURL);
    console.log('[Evolution API] Listening for instance:', instanceName);

    this.socket = io(socketURL, {
      // 允许polling→websocket自动升级（Evolution API要求先polling握手）
      // transports: ['polling', 'websocket'], // Socket.IO默认就是这个顺序
      reconnection: options?.reconnect !== false,
      reconnectionAttempts: this.reconnectConfig.maxAttempts,
      reconnectionDelay: this.reconnectConfig.baseDelay,
      reconnectionDelayMax: this.reconnectConfig.maxDelay,
      timeout: this.reconnectConfig.timeout,
      // Evolution API v2.3.6需要API Key认证
      extraHeaders: {
        apikey: this.config.apiKey,
      },
      auth: {
        apikey: this.config.apiKey,
      },
    });

    // 存储当前监听的实例名，用于事件过滤
    this.currentInstanceName = instanceName;
    this.setupWebSocketHandlers();
  }

  /**
   * 设置 WebSocket 事件处理器
   */
  private setupWebSocketHandlers(): void {
    if (!this.socket) {
      return;
    }

    // Socket.IO event listeners (removed onAny for performance)

    this.socket.on('connect', () => {
      console.log('[Evolution API] ✅ WebSocket connected successfully!');
      console.log('[Evolution API] Socket ID:', this.socket?.id);
      console.log('[Evolution API] Listening for instance:', this.currentInstanceName);
      this.reconnectAttempts = 0;
      this.emit('websocket:connected');
    });

    this.socket.on('disconnect', reason => {
      console.log('[Evolution API] ❌ WebSocket disconnected:', reason);
      this.emit('websocket:disconnected', { reason });
    });

    this.socket.on('connect_error', error => {
      console.error('[Evolution API] ❌ WebSocket connect error:', error);
      console.error('[Evolution API] Error details:', {
        message: error.message,
        error,
      });
      this.handleReconnect();
      this.emit('websocket:error', { error });
    });

    this.socket.on('error', (error: any) => {
      console.error('[Evolution API] ❌ Socket error:', error);
    });

    this.socket.on('connection.update', (data: ConnectionUpdateEvent) => {
      // 全局模式：过滤只处理当前实例的事件
      if (data.instance === this.currentInstanceName) {
        this.emit('connection:update', data);
      }
    });

    this.socket.on('qrcode.updated', (data: unknown) => {
      // 全局模式：过滤只处理当前实例的事件
      const qrData = data as { instance: string };
      if (qrData.instance === this.currentInstanceName) {
        console.log('[Evolution API] QR code updated');
        this.emit('qrcode:updated', data);
      }
    });

    this.socket.on('messages.upsert', (rawData: any) => {
      // Evolution API sends the event data directly, not wrapped in WebSocketEventData
      const { instance } = rawData;
      console.log('[Evolution API] 🔔 WebSocket messages.upsert:', instance, 'current:', this.currentInstanceName);

      // 全局模式：过滤只处理当前实例的事件
      if (instance === this.currentInstanceName) {
        console.log('[Evolution API] ✅ Emitting messages.upsert to MessageService');
        this.emit('messages.upsert', rawData);
      } else {
        console.log('[Evolution API] ⏭️ Skipping - wrong instance');
      }
    });

    this.socket.on('messages.update', (rawData: any) => {
      const { instance } = rawData;

      // 全局模式：过滤只处理当前实例的事件
      if (instance === this.currentInstanceName) {
        this.emit('messages.update', rawData);
      }
    });

    this.socket.on('chats.upsert', (rawData: any) => {
      const { instance } = rawData;

      // 全局模式：过滤只处理当前实例的事件
      if (instance === this.currentInstanceName) {
        this.emit('chats.upsert', rawData);
      }
    });
  }

  /**
   * 🔥 增强：处理重连逻辑 - 验证Evolution API实例状态
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.reconnectConfig.maxAttempts) {
      console.error('[Evolution API] Max reconnect attempts reached');
      this.emit('reconnect:failed');
      return;
    }

    this.reconnectAttempts += 1;
    const delay = Math.min(
      this.reconnectConfig.baseDelay * 2 ** (this.reconnectAttempts - 1),
      this.reconnectConfig.maxDelay,
    );

    const reconnectMsg =
      `[Evolution API] Reconnecting in ${delay}ms ` +
      `(attempt ${this.reconnectAttempts}/${this.reconnectConfig.maxAttempts})`;
    console.log(reconnectMsg);

    this.emit('reconnect:attempt', { attempt: this.reconnectAttempts, delay });

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      // 🔥 新增：重连前验证实例状态
      void (async () => {
        if (this.currentInstanceName) {
          try {
            const status = await this.getConnectionStatus(this.currentInstanceName);
            if (status.state !== 'open') {
              console.warn(
                `[Evolution API] Instance ${this.currentInstanceName} is not open ` +
                  `(${status.state}), aborting reconnect`,
              );
              this.emit('reconnect:failed');
              return;
            }
          } catch (error) {
            console.error(
              '[Evolution API] Failed to verify instance status during reconnect:',
              error,
            );
            // 实例不存在或API调用失败，停止重连
            this.emit('reconnect:failed');
            return;
          }
        }

        // 验证通过，继续重连WebSocket
        if (this.socket && !this.socket.connected) {
          console.log('[Evolution API] Instance verified, reconnecting WebSocket...');
          this.socket.connect();
        }
      })();
    }, delay);
  }

  /**
   * 断开 WebSocket
   */
  disconnectWebSocket(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.reconnectAttempts = 0;
  }

  /**
   * 订阅事件
   */
  on(event: string, handler: (...args: unknown[]) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.add(handler);
    }
  }

  /**
   * 取消订阅事件
   */
  off(event: string, handler: (...args: unknown[]) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * 触发事件
   */
  private emit(event: string, data?: unknown): void {
    const handlers = this.eventHandlers.get(event);
    console.log(`[Evolution API] 📡 Emit ${event}, handlers count:`, handlers?.size ?? 0);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[Evolution API] Error in event handler for ${event}:`, error);
        }
      });
    } else {
      console.log(`[Evolution API] ⚠️ No handlers registered for event: ${event}`);
    }
  }

  /**
   * 处理 API 错误
   */
  // eslint-disable-next-line class-methods-use-this
  private handleAPIError(error: AxiosError): EvolutionAPIError {
    const evolutionError: EvolutionAPIError = {
      code: error.code ?? 'UNKNOWN_ERROR',
      message: error.message ?? 'Unknown error occurred',
      status: error.response?.status,
      details: error.response?.data,
    };

    if (error.response) {
      // 服务器响应错误
      const responseMessage = (error.response.data as { message?: string })?.message;
      evolutionError.message = responseMessage ?? error.message;
    } else if (error.request) {
      // 请求发送但没有响应
      evolutionError.code = 'NO_RESPONSE';
      evolutionError.message = 'Evolution API没有响应,请检查服务是否运行';
    } else {
      // 请求配置错误
      evolutionError.code = 'REQUEST_ERROR';
    }

    return evolutionError;
  }

  /**
   * 🔥 修复：获取聊天列表 - Evolution API v2使用POST /chat/findChats
   */
  async getChats(instanceName: string): Promise<unknown> {
    try {
      // Evolution API v2.3.6使用POST /chat/findChats获取带消息的聊天列表
      const response = await this.axiosInstance.post(`/chat/findChats/${instanceName}`, {});
      return response.data;
    } catch (error) {
      const evolutionError = this.handleAPIError(error as AxiosError);
      throw new Error(evolutionError.message);
    }
  }

  /**
   * 🔥 新增：获取联系人信息（修复 chat.service.ts 的 `as any` 黑魔法）
   */
  async getContactInfo(instanceName: string, whatsappId: string): Promise<unknown> {
    try {
      const response = await this.axiosInstance.get(`/chat/findContact/${instanceName}`, {
        params: { id: whatsappId },
      });
      return response.data;
    } catch (error) {
      const evolutionError = this.handleAPIError(error as AxiosError);
      throw new Error(evolutionError.message);
    }
  }

  /**
   * 🔥 新增：更新聊天置顶状态（实现 chat.service.ts 的 TODO）
   */
  async updateChatPinned(
    instanceName: string,
    whatsappId: string,
    isPinned: boolean,
  ): Promise<void> {
    try {
      // Evolution API: POST /chat/updateChatSettings/:instanceName
      await this.axiosInstance.post(`/chat/updateChatSettings/${instanceName}`, {
        id: whatsappId,
        isPinned,
      });
    } catch (error) {
      const evolutionError = this.handleAPIError(error as AxiosError);
      console.error('[Evolution API] Failed to update chat pinned status:', evolutionError);
      // 不抛出错误，因为本地数据库已经更新
      // throw new Error(evolutionError.message);
    }
  }

  /**
   * 🔥 新增：更新聊天归档状态（实现 chat.service.ts 的 TODO）
   */
  async updateChatArchived(
    instanceName: string,
    whatsappId: string,
    isArchived: boolean,
  ): Promise<void> {
    try {
      // Evolution API: POST /chat/archiveChat/:instanceName
      const endpoint = isArchived ? '/chat/archiveChat' : '/chat/unarchiveChat';
      await this.axiosInstance.post(`${endpoint}/${instanceName}`, {
        id: whatsappId,
      });
    } catch (error) {
      const evolutionError = this.handleAPIError(error as AxiosError);
      console.error('[Evolution API] Failed to update chat archived status:', evolutionError);
      // 不抛出错误，因为本地数据库已经更新
      // throw new Error(evolutionError.message);
    }
  }

  /**
   * 检查 Evolution API 健康状态
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.config.baseURL}/`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      console.error('[Evolution API] Health check failed:', error);
      return false;
    }
  }

  /**
   * 销毁服务实例
   */
  destroy(): void {
    this.disconnectWebSocket();
    this.eventHandlers.clear();
  }
}
