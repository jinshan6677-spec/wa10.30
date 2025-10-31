/**
 * Electron API 类型定义
 * 定义主进程暴露给渲染进程的 API 接口
 */

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

  // 事件监听
  on: (channel: string, callback: (...args: any[]) => void) => void;
  off: (channel: string, callback: (...args: any[]) => void) => void;
  removeAllListeners: (channel: string) => void;
}
