import { useState, useCallback, useRef, useEffect } from 'react';

import { ConnectionStatus } from '../../../../shared/types/evolution-api.types';
import { useConnectionState } from '../contexts/ConnectionStateContext';

interface UseEvolutionAPIReturn {
  isLoading: boolean;
  error: Error | null;
  createInstance: (instanceName: string) => Promise<void>;
  getQRCode: (instanceName: string) => Promise<void>;
  refreshQRCode: (instanceName: string) => Promise<void>;
  disconnect: (instanceName: string) => Promise<void>;
  connectWebSocket: (instanceName: string) => Promise<void>;
  disconnectWebSocket: () => Promise<void>;
  connectWithHybridStrategy: (instanceName: string) => Promise<void>;
}

export const useEvolutionAPI = (): UseEvolutionAPIReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { updateStatus, updateQRCode, updateError, resetSession } = useConnectionState();

  // 轮询定时器ref
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isWebSocketConnectedRef = useRef(false);

  // 清理轮询定时器
  useEffect(
    () => () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    },
    [],
  );

  /**
   * 内部辅助函数: 创建实例并检查连接状态
   * @returns true 如果实例已连接, false 如果需要继续QR流程
   */
  const createInstanceInternal = useCallback(
    async (instanceName: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      updateStatus(ConnectionStatus.INITIALIZING);

      try {
        const result = await window.electronAPI.evolutionAPI.createInstance(instanceName);

        if (result.success) {
          // 检查是否已经连接（跳过QR流程）
          if ((result.data).alreadyConnected) {
            updateStatus(ConnectionStatus.CONNECTED);
            return true; // 返回true表示已连接
          }

          // 如果响应中包含二维码,更新状态
          if (result.data.qrcode?.base64) {
            updateQRCode(result.data.qrcode.base64);
            updateStatus(ConnectionStatus.QR_CODE_READY);
          } else {
            updateStatus(ConnectionStatus.CONNECTING);
          }

          return false; // 返回false表示需要继续QR流程
        }
        throw new Error(result.error ?? 'Failed to create instance');

      } catch (err) {
        const errorObj = err as Error;
        console.error('[useEvolutionAPI] Create instance error:', errorObj);
        setError(errorObj);
        updateError(errorObj);
        updateStatus(ConnectionStatus.ERROR);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [updateStatus, updateQRCode, updateError],
  );

  /**
   * 公共接口: 创建实例（保持向后兼容）
   */
  const createInstance = useCallback(
    async (instanceName: string): Promise<void> => {
      await createInstanceInternal(instanceName);
    },
    [createInstanceInternal],
  );

  /**
   * 获取 QR 码 (仅用于初始化)
   * 注意: Evolution API v2.3.6 的 GET /instance/connect 返回 {pairingCode, code}
   * base64 格式的 QR 码图片只通过 WebSocket qrcode.updated 事件发送
   */
  const getQRCode = useCallback(
    async (instanceName: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await window.electronAPI.evolutionAPI.getQRCode(instanceName);

        if (result.success) {
          // Evolution API v2.3.6: REST API 返回 pairingCode/code, 不返回 base64
          // base64 会通过 WebSocket qrcode.updated 事件异步发送
          // 这里只触发连接,实际 QR 码会由 WebSocket 事件处理

          const qrCode = result.data.base64 ?? result.data.pairingCode ?? null;

          if (qrCode) {
            // 如果有 base64 或 pairingCode,更新状态
            updateQRCode(qrCode);
            updateStatus(ConnectionStatus.QR_CODE_READY);
          } else {
            // 如果没有二维码数据,设置为等待 WebSocket 事件
            updateStatus(ConnectionStatus.CONNECTING);
          }
        } else {
          throw new Error(result.error ?? 'Failed to get QR code');
        }
      } catch (err) {
        const errorObj = err as Error;
        console.error('[useEvolutionAPI] Get QR code error:', errorObj);
        setError(errorObj);
        updateError(errorObj);
        updateStatus(ConnectionStatus.ERROR);
      } finally {
        setIsLoading(false);
      }
    },
    [updateQRCode, updateStatus, updateError],
  );

  /**
   * 刷新 QR 码
   * Evolution API 正确流程:
   * 1. 清除当前 QR 码
   * 2. 调用 GET /instance/connect/{instance} 触发新 QR 生成
   * 3. WebSocket qrcode.updated 事件会发送新的 base64 QR 码
   */
  const refreshQRCode = useCallback(
    async (instanceName: string) => {
      setIsLoading(true);
      setError(null);

      try {
        // 步骤1: 清除当前 QR 码,显示加载状态
        updateQRCode(null);
        updateStatus(ConnectionStatus.CONNECTING);

        // 步骤2: 调用 connect 端点触发新 QR 生成
        // 这会触发 Evolution API 生成新的二维码
        await getQRCode(instanceName);

        // 步骤3: 新的 base64 QR 码会通过 WebSocket qrcode.updated 事件发送
        // 由 ConnectionStateContext 的 handleQRCodeUpdated 处理
      } catch (err) {
        const errorObj = err as Error;
        console.error('[useEvolutionAPI] Refresh QR error:', errorObj);
        setError(errorObj);
        updateError(errorObj);
        updateStatus(ConnectionStatus.ERROR);
      } finally {
        setIsLoading(false);
      }
    },
    [getQRCode, updateQRCode, updateStatus, updateError],
  );

  const disconnect = useCallback(
    async (instanceName: string) => {
      setIsLoading(true);
      setError(null);

      try {
        await window.electronAPI.evolutionAPI.disconnect(instanceName, {
          logout: true,
          removeInstance: false,
        });

        // 🔥 修复：使用 resetSession 重置所有会话状态（包括 sessionValid）
        resetSession();
      } catch (err) {
        const errorObj = err as Error;
        console.error('[useEvolutionAPI] Disconnect error:', errorObj);
        setError(errorObj);
        updateError(errorObj);
      } finally {
        setIsLoading(false);
      }
    },
    [resetSession, updateError],
  );

  const connectWebSocket = useCallback(
    async (instanceName: string) => {
      setIsLoading(true);
      setError(null);

      try {
        await window.electronAPI.evolutionAPI.connectWebSocket(instanceName);
        updateStatus(ConnectionStatus.CONNECTING);
      } catch (err) {
        const errorObj = err as Error;
        console.error('[useEvolutionAPI] Connect WebSocket error:', errorObj);
        setError(errorObj);
        updateError(errorObj);
        updateStatus(ConnectionStatus.ERROR);
      } finally {
        setIsLoading(false);
      }
    },
    [updateStatus, updateError],
  );

  const disconnectWebSocket = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await window.electronAPI.evolutionAPI.disconnectWebSocket();
      updateStatus(ConnectionStatus.DISCONNECTED);
      isWebSocketConnectedRef.current = false;
    } catch (err) {
      const errorObj = err as Error;
      console.error('[useEvolutionAPI] Disconnect WebSocket error:', errorObj);
      setError(errorObj);
      updateError(errorObj);
    } finally {
      setIsLoading(false);
    }
  }, [updateStatus, updateError]);

  /**
   * 优化连接策略：
   * 1. 创建/检查实例
   * 2. 连接 WebSocket 以接收实时事件
   * 3. 主动获取一次 QR 码 (触发 Evolution API 发送 qrcode.updated 事件)
   * 4. 后续的 QR 码更新通过 WebSocket 自动接收
   */
  const connectWithHybridStrategy = useCallback(
    async (instanceName: string) => {
      try {
        // 清理之前可能存在的轮询
        if (pollingTimerRef.current) {
          clearInterval(pollingTimerRef.current);
          pollingTimerRef.current = null;
        }

        // 步骤1: 创建/检查实例
        const alreadyConnected = await createInstanceInternal(instanceName);

        // 如果实例已连接，跳过后续步骤
        if (alreadyConnected) {
          // 仍然需要连接WebSocket以接收新消息
          try {
            await connectWebSocket(instanceName);
            isWebSocketConnectedRef.current = true;
          } catch (wsErr) {
            console.warn('[useEvolutionAPI] WebSocket connection failed, but instance is connected:', wsErr);
          }

          return; // 提前返回，跳过QR码流程
        }

        // 步骤2: 连接 WebSocket 以接收实时事件
        await connectWebSocket(instanceName);
        isWebSocketConnectedRef.current = true;

        // 步骤3: 主动获取一次 QR 码
        // 注意: 移除了之前的 2 秒等待，因为会减慢连接速度
        // WebSocket 连接通常在 200-500ms 内完成，不需要额外延迟
        // 这会触发 Evolution API 通过 WebSocket 发送 qrcode.updated 事件
        await getQRCode(instanceName);
      } catch (err) {
        const errorObj = err as Error;
        console.error('[useEvolutionAPI] ❌ Connection failed:', errorObj);
        setError(errorObj);
        updateError(errorObj);
        updateStatus(ConnectionStatus.ERROR);
        throw errorObj;
      }
    },
    [createInstanceInternal, connectWebSocket, getQRCode, updateError, updateStatus],
  );

  return {
    isLoading,
    error,
    createInstance,
    getQRCode,
    refreshQRCode,
    disconnect,
    connectWebSocket,
    disconnectWebSocket,
    connectWithHybridStrategy,
  };
};
