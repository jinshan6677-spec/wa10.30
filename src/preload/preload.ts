import { contextBridge, ipcRenderer } from 'electron';

import type { ElectronAPI } from '../shared/types/electron-api.types';

// 有效的IPC频道列表
const validChannels = [
  'app-update-available',
  'app-update-downloaded',
  'window-focus',
  'window-blur',
  // Evolution API 事件
  'evolution-api:connection-update',
  'evolution-api:qrcode-updated',
  'evolution-api:websocket-connected',
  'evolution-api:websocket-disconnected',
  'evolution-api:websocket-error',
  'evolution-api:reconnect-attempt',
  'evolution-api:reconnect-failed',
  // Chat 事件
  'chat:list-updated',
  'chat:updated',
  // Message 事件
  'message:new',
  'message:status-update',
];

// 暴露安全的API到渲染进程
const electronAPI: ElectronAPI = {
  // 应用信息
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  getPlatform: () => ipcRenderer.invoke('app:getPlatform'),

  // 窗口控制
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),

  // 对话框
  showMessageBox: options => ipcRenderer.invoke('dialog:showMessageBox', options),

  // 外部链接
  openExternal: url => ipcRenderer.invoke('shell:openExternal', url),

  // Evolution API - WhatsApp 连接
  evolutionAPI: {
    createInstance: (instanceName: string) =>
      ipcRenderer.invoke('evolution-api:createInstance', instanceName),
    getQRCode: (instanceName: string) =>
      ipcRenderer.invoke('evolution-api:getQRCode', instanceName),
    getConnectionStatus: (instanceName: string) =>
      ipcRenderer.invoke('evolution-api:getConnectionStatus', instanceName),
    disconnect: (instanceName: string, options?: any) =>
      ipcRenderer.invoke('evolution-api:disconnect', instanceName, options),
    connectWebSocket: (instanceName: string) =>
      ipcRenderer.invoke('evolution-api:connectWebSocket', instanceName),
    disconnectWebSocket: () => ipcRenderer.invoke('evolution-api:disconnectWebSocket'),
  },

  // Chat API - 聊天列表和联系人管理
  chatAPI: {
    syncChats: (instanceName: string) => ipcRenderer.invoke('chat:sync', instanceName),
    getChats: (request?: any) => ipcRenderer.invoke('chat:get-list', request),
    getContactInfo: (whatsappId: string) =>
      ipcRenderer.invoke('chat:get-contact-info', whatsappId),
    searchChats: (query: string, limit?: number) =>
      ipcRenderer.invoke('chat:search', query, limit),
    updateChat: (request: any) => ipcRenderer.invoke('chat:update', request),
  },

  // Message API - 消息收发和管理
  messageAPI: {
    getMessages: (request: any) => ipcRenderer.invoke('message:get-list', request),
    subscribe: (chatId: string) => ipcRenderer.invoke('message:subscribe', chatId),
    unsubscribe: (chatId: string) => ipcRenderer.invoke('message:unsubscribe', chatId),
    markAsRead: (request: any) => ipcRenderer.invoke('message:mark-read', request),
    updateStatus: (request: any) => ipcRenderer.invoke('message:update-status', request),
    setInstance: (instanceName: string) =>
      ipcRenderer.invoke('message:set-instance', instanceName),
    sendMessage: (params: any) => ipcRenderer.invoke('message:send', params),
    sendTypingStatus: (params: any) => ipcRenderer.invoke('message:send-typing-status', params),
    // 🔥 测试端点
    simulateMessage: (chatId: string) => ipcRenderer.invoke('test:simulate-message', chatId),
  },

  // 事件监听
  on: (channel, callback) => {
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, callback);
    } else {
      console.warn(`尝试监听无效的IPC频道: ${channel}`);
    }
  },

  off: (channel, callback) => {
    if (validChannels.includes(channel)) {
      ipcRenderer.off(channel, callback);
    }
  },

  removeAllListeners: channel => {
    if (validChannels.includes(channel)) {
      ipcRenderer.removeAllListeners(channel);
    }
  },
};

// 使用contextBridge安全地暴露API
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// 开发环境下的调试信息
if (process.env.NODE_ENV === 'development') {
  console.log('Preload script loaded successfully');
  console.log('Available electronAPI methods:', Object.keys(electronAPI));
}

// 安全检查：确保在正确的环境中运行
if (!process.contextIsolated) {
  console.error('预加载脚本需要contextIsolation设置为true');
}
