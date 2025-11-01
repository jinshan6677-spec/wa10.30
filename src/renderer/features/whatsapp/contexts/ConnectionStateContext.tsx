import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';

import type { ConnectionState } from '../../../../shared/types/evolution-api.types';
import { ConnectionStatus } from '../../../../shared/types/evolution-api.types';

interface ConnectionStateContextValue {
  connectionState: ConnectionState;
  setConnectionState: React.Dispatch<React.SetStateAction<ConnectionState>>;
  updateStatus: (status: ConnectionStatus) => void;
  updateQRCode: (qrCode: string | null) => void;
  updateError: (error: Error | null) => void;
  incrementReconnectAttempts: () => void;
  resetReconnectAttempts: () => void;
  resetSession: () => void; // 🔥 新增：重置会话状态
}

const ConnectionStateContext = createContext<ConnectionStateContextValue | undefined>(undefined);

const initialConnectionState: ConnectionState = {
  status: ConnectionStatus.DISCONNECTED,
  instanceKey: null,
  phoneNumber: null,
  qrCode: null,
  error: null,
  lastConnected: null,
  reconnectAttempts: 0,
  sessionValid: false,
};

interface ConnectionStateProviderProps {
  children: ReactNode;
}

// 🔥 修复：从 localStorage 初始化连接状态，避免页面刷新时状态丢失
const loadInitialState = (): ConnectionState => {
  try {
    const stored = localStorage.getItem('whatsapp-connection-state');
    if (stored) {
      const persisted = JSON.parse(stored) as ConnectionState;
      // 将 Date 字符串转换回 Date 对象
      if (persisted.lastConnected) {
        persisted.lastConnected = new Date(persisted.lastConnected);
      }
      console.log('[ConnectionState] 📦 Loaded persisted state from localStorage:', persisted.status);
      return persisted;
    }
  } catch (error) {
    console.error('[ConnectionState] Failed to load persisted state:', error);
  }
  console.log('[ConnectionState] 📦 No persisted state found, using initial state');
  return initialConnectionState;
};

export const ConnectionStateProvider: React.FC<ConnectionStateProviderProps> = ({ children }) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(loadInitialState);
  // 移除防抖机制 - WebSocket事件已有Evolution API的自然节流

  // 订阅 Evolution API 事件
  useEffect(() => {
    const { electronAPI } = window;

    // WebSocket 连接成功
    const handleWebSocketConnected = () => {
      console.log('[ConnectionState] WebSocket connected');
      setConnectionState(prev => ({
        ...prev,
        reconnectAttempts: 0,
      }));
    };

    // WebSocket 断开连接
    const handleWebSocketDisconnected = (data: { reason: string }) => {
      console.log('[ConnectionState] 🔌 WebSocket disconnected:', data.reason);
      // 🔥 修复：WebSocket 断开时标记会话为无效，触发自动跳转到登录页
      setConnectionState(prev => ({
        ...prev,
        status: ConnectionStatus.DISCONNECTED,
        sessionValid: false, // 标记会话无效
      }));
    };

    // WebSocket 错误
    const handleWebSocketError = (data: { error: Error }) => {
      console.error('[ConnectionState] WebSocket error:', data.error);
      setConnectionState(prev => ({
        ...prev,
        error: data.error,
        status: ConnectionStatus.ERROR,
      }));
    };

    // 连接状态更新
    const handleConnectionUpdate = (_event: any, eventData: any) => {
      // 🔥 修复：Evolution API 的事件结构是 eventData.data.state，而不是 eventData.state
      const data = eventData.data ?? eventData;
      const {state} = data;

      if (state === 'open') {
        console.log('[ConnectionState] ✅ WhatsApp connected successfully!');

        // 提取绑定的手机号（用于会话持久化）
        const phoneNumber = data.user?.phoneNumber ?? data.user?.id?.replace('@s.whatsapp.net', '') ?? null;

        setConnectionState(prev => ({
          ...prev,
          status: ConnectionStatus.CONNECTED,
          lastConnected: new Date(),
          instanceKey: data.instance,
          phoneNumber,
          sessionValid: true,
          error: null,
        }));

        // 连接成功后自动同步聊天数据（符合WhatsApp流程）
        // 使用 chatAPI.syncChats 同步最新的聊天列表
        void (async () => {
          try {
            // 🔥 关键修复：设置 MessageService 的实例名
            await window.electronAPI.messageAPI.setInstance(data.instance);
            const syncResponse = await window.electronAPI.chatAPI.syncChats(data.instance);

            if (!syncResponse.success) {
              console.error('[ConnectionState] ❌ Chat sync failed:', syncResponse.error);
            }
          } catch (error) {
            console.error('[ConnectionState] ❌ Error syncing chats:', error);
          }
        })();
      } else if (state === 'close') {
        console.log('[ConnectionState] 🔌 WhatsApp connection closed');
        // 🔥 修复：连接关闭时标记会话为无效，触发自动跳转到登录页
        setConnectionState(prev => ({
          ...prev,
          status: ConnectionStatus.DISCONNECTED,
          sessionValid: false, // 标记会话失效
        }));
      } else if (state === 'connecting') {
        setConnectionState(prev => ({
          ...prev,
          status: ConnectionStatus.CONNECTING,
        }));
      }
    };

    // 二维码更新 - 直接从WebSocket事件提取
    const handleQRCodeUpdated = (_event: any, eventData: any) => {
      console.log('[ConnectionState] QR code update received for:', eventData.instance);

      // Evolution API v2.3.6 WebSocket事件包含完整QR码数据
      // 数据结构: eventData.data.qrcode.base64 或 eventData.data.qrcode.pairingCode
      try {
        const qrCode =
          eventData?.data?.qrcode?.base64 ?? eventData?.data?.qrcode?.pairingCode ?? null;

        if (qrCode) {
          console.log(
            '[ConnectionState] QR code extracted from WebSocket event (length:',
            qrCode.length,
            ')',
          );
          setConnectionState(prev => ({
            ...prev,
            qrCode,
            status: ConnectionStatus.QR_CODE_READY,
            error: null, // 清除之前的错误
          }));
        } else {
          console.warn('[ConnectionState] QR code event has no base64 or pairingCode data');
          console.log(
            '[ConnectionState] Event data structure:',
            JSON.stringify(eventData, null, 2),
          );

          // QR码数据缺失时设置错误状态
          setConnectionState(prev => ({
            ...prev,
            error: new Error('QR code data missing from WebSocket event'),
            status: ConnectionStatus.ERROR,
          }));
        }
      } catch (error) {
        console.error('[ConnectionState] Error extracting QR code from event:', error);
        setConnectionState(prev => ({
          ...prev,
          error: error as Error,
          status: ConnectionStatus.ERROR,
        }));
      }
    };

    // 重连尝试
    const handleReconnectAttempt = (data: { attempt: number; delay: number }) => {
      console.log(`[ConnectionState] Reconnect attempt ${data.attempt}, delay: ${data.delay}ms`);
      setConnectionState(prev => ({
        ...prev,
        reconnectAttempts: data.attempt,
        status: ConnectionStatus.CONNECTING,
      }));
    };

    // 重连失败
    const handleReconnectFailed = () => {
      console.error('[ConnectionState] Reconnect failed');
      setConnectionState(prev => ({
        ...prev,
        status: ConnectionStatus.ERROR,
        error: new Error('Max reconnect attempts reached'),
      }));
    };

    // 注册事件监听器
    // 检查是否在Electron环境中
    if (!electronAPI) {
      console.warn('ConnectionStateContext: Not running in Electron environment');
      return () => {};
    }

    electronAPI.on('evolution-api:websocket-connected', handleWebSocketConnected);
    electronAPI.on('evolution-api:websocket-disconnected', handleWebSocketDisconnected);
    electronAPI.on('evolution-api:websocket-error', handleWebSocketError);
    electronAPI.on('evolution-api:connection-update', handleConnectionUpdate);
    electronAPI.on('evolution-api:qrcode-updated', handleQRCodeUpdated);
    electronAPI.on('evolution-api:reconnect-attempt', handleReconnectAttempt);
    electronAPI.on('evolution-api:reconnect-failed', handleReconnectFailed);

    // 清理函数
    return () => {
      electronAPI.off('evolution-api:websocket-connected', handleWebSocketConnected);
      electronAPI.off('evolution-api:websocket-disconnected', handleWebSocketDisconnected);
      electronAPI.off('evolution-api:websocket-error', handleWebSocketError);
      electronAPI.off('evolution-api:connection-update', handleConnectionUpdate);
      electronAPI.off('evolution-api:qrcode-updated', handleQRCodeUpdated);
      electronAPI.off('evolution-api:reconnect-attempt', handleReconnectAttempt);
      electronAPI.off('evolution-api:reconnect-failed', handleReconnectFailed);
    };
  }, []);

  // 辅助方法
  const updateStatus = (status: ConnectionStatus) => {
    setConnectionState(prev => ({ ...prev, status }));
  };

  const updateQRCode = (qrCode: string | null) => {
    setConnectionState(prev => ({
      ...prev,
      qrCode,
      status: qrCode ? ConnectionStatus.QR_CODE_READY : prev.status,
    }));
  };

  const updateError = (error: Error | null) => {
    setConnectionState(prev => ({
      ...prev,
      error,
      status: error ? ConnectionStatus.ERROR : prev.status,
    }));
  };

  const incrementReconnectAttempts = () => {
    setConnectionState(prev => ({
      ...prev,
      reconnectAttempts: prev.reconnectAttempts + 1,
    }));
  };

  const resetReconnectAttempts = () => {
    setConnectionState(prev => ({
      ...prev,
      reconnectAttempts: 0,
    }));
  };

  // 🔥 新增：重置会话状态（用于退出登录）
  const resetSession = () => {
    console.log('[ConnectionState] 🔓 Resetting session state (logout)');
    setConnectionState({
      ...initialConnectionState,
      status: ConnectionStatus.DISCONNECTED,
      sessionValid: false,
    });
  };

  // 持久化连接状态到本地存储
  useEffect(() => {
    try {
      localStorage.setItem('whatsapp-connection-state', JSON.stringify(connectionState));
    } catch (error) {
      console.error('[ConnectionState] Failed to persist state:', error);
    }
  }, [connectionState]);

  // 🔥 新增：会话恢复验证机制（修复重启后需要重新扫码的问题）
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // 🔥 修复：优先使用硬编码的实例名，因为它是固定的
        const INSTANCE_NAME = 'whatsapp_main';

        console.log('[ConnectionState] 🔍 Checking for existing Evolution API instance...');

        // 🔥 修复：直接检查 Evolution API 实例状态，不依赖 localStorage
        const statusResponse = await window.electronAPI.evolutionAPI.getConnectionStatus(
          INSTANCE_NAME,
        );

        if (!statusResponse.success) {
          console.log('[ConnectionState] ❌ Instance does not exist, will create new one');
          return;
        }

        const instanceStatus = statusResponse.data.instance?.state;
        console.log('[ConnectionState] 📊 Instance status:', instanceStatus);
        console.log('[ConnectionState] 📋 Full response:', JSON.stringify(statusResponse.data, null, 2));

        if (instanceStatus === 'open') {
          // 实例已连接，直接恢复 CONNECTED 状态
          console.log('[ConnectionState] ✅ WhatsApp already connected! Restoring session...');

          // 尝试从 localStorage 获取电话号码
          const stored = localStorage.getItem('whatsapp-connection-state');
          let phoneNumber = null;
          if (stored) {
            try {
              const persisted = JSON.parse(stored) as ConnectionState;
              phoneNumber = persisted.phoneNumber;
            } catch (e) {
              console.warn('[ConnectionState] Failed to parse stored state:', e);
            }
          }

          setConnectionState({
            status: ConnectionStatus.CONNECTED,
            instanceKey: INSTANCE_NAME,
            phoneNumber,
            qrCode: null,
            error: null,
            lastConnected: new Date(),
            reconnectAttempts: 0,
            sessionValid: true,
          });

          // 🔥 关键修复：设置 MessageService 的实例名（应用重启后恢复）
          console.log('[ConnectionState] 📝 Setting MessageService instance name...');
          await window.electronAPI.messageAPI.setInstance(INSTANCE_NAME);

          // 🔥 关键修复：同步聊天列表（这也会设置 ChatService 的实例名）
          console.log('[ConnectionState] 🔄 Syncing chats after session restore...');
          const syncResponse = await window.electronAPI.chatAPI.syncChats(INSTANCE_NAME);
          if (!syncResponse.success) {
            console.error('[ConnectionState] ❌ Chat sync failed:', syncResponse.error);
          }

          // 重新连接WebSocket以接收实时事件
          console.log('[ConnectionState] 🔌 Connecting WebSocket...');
          await window.electronAPI.evolutionAPI.connectWebSocket(INSTANCE_NAME);
        } else {
          // 实例存在但未连接
          console.log('[ConnectionState] ℹ️ Instance exists but not connected (state:', instanceStatus, ')');
        }
      } catch (error) {
        console.error('[ConnectionState] ❌ Failed to restore session:', error);
        // 发生错误时不恢复会话
      }
    };

    void restoreSession();
  }, []);

  const value: ConnectionStateContextValue = {
    connectionState,
    setConnectionState,
    updateStatus,
    updateQRCode,
    updateError,
    incrementReconnectAttempts,
    resetReconnectAttempts,
    resetSession, // 🔥 新增：导出重置会话方法
  };

  return (
    <ConnectionStateContext.Provider value={value}>{children}</ConnectionStateContext.Provider>
  );
};

// 自定义 Hook 用于使用 Context
export const useConnectionState = (): ConnectionStateContextValue => {
  const context = useContext(ConnectionStateContext);
  if (!context) {
    throw new Error('useConnectionState must be used within a ConnectionStateProvider');
  }
  return context;
};
