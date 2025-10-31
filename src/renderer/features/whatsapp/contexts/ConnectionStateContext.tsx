import type { ReactNode } from 'react';
import React, {
  createContext, useContext, useState, useEffect,
} from 'react';

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
}

const ConnectionStateContext = createContext<ConnectionStateContextValue | undefined>(undefined);

const initialConnectionState: ConnectionState = {
  status: ConnectionStatus.DISCONNECTED,
  instanceKey: null,
  qrCode: null,
  error: null,
  lastConnected: null,
  reconnectAttempts: 0,
};

interface ConnectionStateProviderProps {
  children: ReactNode;
}

export const ConnectionStateProvider: React.FC<ConnectionStateProviderProps> = ({ children }) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(initialConnectionState);
  // 移除防抖机制 - WebSocket事件已有Evolution API的自然节流

  // 订阅 Evolution API 事件
  useEffect(() => {
    const { electronAPI } = window;

    // WebSocket 连接成功
    const handleWebSocketConnected = () => {
      console.log('[ConnectionState] WebSocket connected');
      setConnectionState((prev) => ({
        ...prev,
        reconnectAttempts: 0,
      }));
    };

    // WebSocket 断开连接
    const handleWebSocketDisconnected = (data: { reason: string }) => {
      console.log('[ConnectionState] WebSocket disconnected:', data.reason);
      setConnectionState((prev) => ({
        ...prev,
        status: ConnectionStatus.DISCONNECTED,
      }));
    };

    // WebSocket 错误
    const handleWebSocketError = (data: { error: Error }) => {
      console.error('[ConnectionState] WebSocket error:', data.error);
      setConnectionState((prev) => ({
        ...prev,
        error: data.error,
        status: ConnectionStatus.ERROR,
      }));
    };

    // 连接状态更新
    const handleConnectionUpdate = (data: { instance: string; state: string }) => {
      console.log('[ConnectionState] Connection update:', data);

      if (data.state === 'open') {
        setConnectionState((prev) => ({
          ...prev,
          status: ConnectionStatus.CONNECTED,
          lastConnected: new Date(),
          instanceKey: data.instance,
          error: null,
        }));
      } else if (data.state === 'close') {
        setConnectionState((prev) => ({
          ...prev,
          status: ConnectionStatus.DISCONNECTED,
        }));
      } else if (data.state === 'connecting') {
        setConnectionState((prev) => ({
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
        const qrCode = eventData?.data?.qrcode?.base64 ?? eventData?.data?.qrcode?.pairingCode ?? null;

        if (qrCode) {
          console.log(
            '[ConnectionState] QR code extracted from WebSocket event (length:',
            qrCode.length,
            ')',
          );
          setConnectionState((prev) => ({
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
          setConnectionState((prev) => ({
            ...prev,
            error: new Error('QR code data missing from WebSocket event'),
            status: ConnectionStatus.ERROR,
          }));
        }
      } catch (error) {
        console.error('[ConnectionState] Error extracting QR code from event:', error);
        setConnectionState((prev) => ({
          ...prev,
          error: error as Error,
          status: ConnectionStatus.ERROR,
        }));
      }
    };

    // 重连尝试
    const handleReconnectAttempt = (data: { attempt: number; delay: number }) => {
      console.log(`[ConnectionState] Reconnect attempt ${data.attempt}, delay: ${data.delay}ms`);
      setConnectionState((prev) => ({
        ...prev,
        reconnectAttempts: data.attempt,
        status: ConnectionStatus.CONNECTING,
      }));
    };

    // 重连失败
    const handleReconnectFailed = () => {
      console.error('[ConnectionState] Reconnect failed');
      setConnectionState((prev) => ({
        ...prev,
        status: ConnectionStatus.ERROR,
        error: new Error('Max reconnect attempts reached'),
      }));
    };

    // 注册事件监听器
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
    setConnectionState((prev) => ({ ...prev, status }));
  };

  const updateQRCode = (qrCode: string | null) => {
    setConnectionState((prev) => ({
      ...prev,
      qrCode,
      status: qrCode ? ConnectionStatus.QR_CODE_READY : prev.status,
    }));
  };

  const updateError = (error: Error | null) => {
    setConnectionState((prev) => ({
      ...prev,
      error,
      status: error ? ConnectionStatus.ERROR : prev.status,
    }));
  };

  const incrementReconnectAttempts = () => {
    setConnectionState((prev) => ({
      ...prev,
      reconnectAttempts: prev.reconnectAttempts + 1,
    }));
  };

  const resetReconnectAttempts = () => {
    setConnectionState((prev) => ({
      ...prev,
      reconnectAttempts: 0,
    }));
  };

  // 持久化连接状态到本地存储
  useEffect(() => {
    try {
      localStorage.setItem('whatsapp-connection-state', JSON.stringify(connectionState));
    } catch (error) {
      console.error('[ConnectionState] Failed to persist state:', error);
    }
  }, [connectionState]);

  // 从本地存储恢复连接状态
  useEffect(() => {
    try {
      const stored = localStorage.getItem('whatsapp-connection-state');
      if (stored) {
        const parsedState = JSON.parse(stored) as ConnectionState;
        // 只恢复特定字段,不恢复临时状态
        setConnectionState((prev) => ({
          ...prev,
          instanceKey: parsedState.instanceKey,
          lastConnected: parsedState.lastConnected ? new Date(parsedState.lastConnected) : null,
        }));
      }
    } catch (error) {
      console.error('[ConnectionState] Failed to restore state:', error);
    }
  }, []);

  const value: ConnectionStateContextValue = {
    connectionState,
    setConnectionState,
    updateStatus,
    updateQRCode,
    updateError,
    incrementReconnectAttempts,
    resetReconnectAttempts,
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
