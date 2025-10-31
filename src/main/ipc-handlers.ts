import { ipcMain, BrowserWindow } from 'electron';

import { environment } from '../shared/config/environment';
import type { CreateInstanceRequest, DisconnectOptions } from '../shared/types/evolution-api.types';

import { EvolutionAPIService } from './services/evolution-api.service';
import { securityService } from './services/security.service';

/**
 * Evolution API 服务实例 (单例)
 */
let evolutionAPIService: EvolutionAPIService | null = null;

/**
 * 设置 WebSocket 事件转发到渲染进程
 */
function setupWebSocketEventForwarding(service: EvolutionAPIService): void {
  const mainWindow = BrowserWindow.getAllWindows()[0];
  if (!mainWindow) {
    return;
  }

  service.on('websocket:connected', () => {
    mainWindow.webContents.send('evolution-api:websocket-connected');
  });

  service.on('websocket:disconnected', (data: unknown) => {
    mainWindow.webContents.send('evolution-api:websocket-disconnected', data);
  });

  service.on('websocket:error', (data: unknown) => {
    mainWindow.webContents.send('evolution-api:websocket-error', data);
  });

  service.on('connection:update', (data: unknown) => {
    mainWindow.webContents.send('evolution-api:connection-update', data);
  });

  service.on('qrcode:updated', (data: unknown) => {
    mainWindow.webContents.send('evolution-api:qrcode-updated', data);
  });

  service.on('reconnect:attempt', (data: unknown) => {
    mainWindow.webContents.send('evolution-api:reconnect-attempt', data);
  });

  service.on('reconnect:failed', () => {
    mainWindow.webContents.send('evolution-api:reconnect-failed');
  });
}

/**
 * 初始化 Evolution API 服务
 */
async function initializeEvolutionAPI(): Promise<EvolutionAPIService> {
  if (evolutionAPIService) {
    return evolutionAPIService;
  }

  // 初始化加密密钥
  const encryptionKey = environment.getEncryptionKey();
  if (encryptionKey) {
    securityService.initializeEncryptionKey(encryptionKey);
  }

  // 尝试从系统密钥链获取 API 密钥
  let apiKey = await securityService.retrieveAPIKey('evolution-api');

  // 如果密钥链中没有,使用环境变量并存储
  if (!apiKey) {
    apiKey = environment.getEvolutionAPIKey();
    if (apiKey) {
      await securityService.storeAPIKey('evolution-api', apiKey);
      console.log('[IPC] Evolution API key stored to system keychain');
    } else {
      throw new Error('Evolution API key not configured');
    }
  }

  // 创建服务实例
  evolutionAPIService = new EvolutionAPIService({
    baseURL: environment.getEvolutionAPIBaseURL(),
    apiKey,
    instancePrefix: environment.getEvolutionInstancePrefix(),
  });

  // 设置 WebSocket 事件转发到渲染进程
  setupWebSocketEventForwarding(evolutionAPIService);

  console.log('[IPC] Evolution API service initialized');
  return evolutionAPIService;
}

/**
 * 注册所有 IPC handlers
 */
export function registerIPCHandlers(): void {
  // Evolution API: 创建实例
  ipcMain.handle('evolution-api:createInstance', async (_event, instanceName: string) => {
    try {
      const service = await initializeEvolutionAPI();

      // 检查实例是否已存在
      const exists = await service.instanceExists(instanceName);
      if (exists) {
        console.log('[IPC] Instance already exists:', instanceName);
        return { success: true, data: { instance: { instanceName } } };
      }

      const request: CreateInstanceRequest = {
        instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      };

      const response = await service.createInstance(request);
      console.log('[IPC] Instance created:', instanceName);
      return { success: true, data: response };
    } catch (error) {
      console.error('[IPC] Failed to create instance:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  });

  // Evolution API: 获取二维码
  ipcMain.handle('evolution-api:getQRCode', async (_event, instanceName: string) => {
    try {
      const service = await initializeEvolutionAPI();
      const qrCode = await service.getQRCode(instanceName);
      console.log('[IPC] QR code retrieved for:', instanceName);
      return { success: true, data: qrCode };
    } catch (error) {
      console.error('[IPC] Failed to get QR code:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  });

  // Evolution API: 获取连接状态
  ipcMain.handle('evolution-api:getConnectionStatus', async (_event, instanceName: string) => {
    try {
      const service = await initializeEvolutionAPI();
      const status = await service.getConnectionStatus(instanceName);
      return { success: true, data: status };
    } catch (error) {
      console.error('[IPC] Failed to get connection status:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  });

  // Evolution API: 断开连接
  ipcMain.handle(
    'evolution-api:disconnect',
    async (_event, instanceName: string, options?: DisconnectOptions) => {
      try {
        const service = await initializeEvolutionAPI();
        await service.disconnect(instanceName, options);
        console.log('[IPC] Disconnected:', instanceName);
        return { success: true };
      } catch (error) {
        console.error('[IPC] Failed to disconnect:', error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    },
  );

  // Evolution API: 连接 WebSocket
  ipcMain.handle('evolution-api:connectWebSocket', async (_event, instanceName: string) => {
    try {
      const service = await initializeEvolutionAPI();
      service.connectWebSocket(instanceName, { reconnect: true });
      console.log('[IPC] WebSocket connecting for:', instanceName);
      return { success: true };
    } catch (error) {
      console.error('[IPC] Failed to connect WebSocket:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  });

  // Evolution API: 断开 WebSocket
  ipcMain.handle('evolution-api:disconnectWebSocket', async () => {
    try {
      if (evolutionAPIService) {
        evolutionAPIService.disconnectWebSocket();
        console.log('[IPC] WebSocket disconnected');
      }
      return { success: true };
    } catch (error) {
      console.error('[IPC] Failed to disconnect WebSocket:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  });

  console.log('[IPC] All Evolution API handlers registered');
}

/**
 * 清理 Evolution API 服务
 */
export function cleanupEvolutionAPI(): void {
  if (evolutionAPIService) {
    evolutionAPIService.destroy();
    evolutionAPIService = null;
    console.log('[IPC] Evolution API service cleaned up');
  }
}
