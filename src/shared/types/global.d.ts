/**
 * 全局类型定义
 * 为渲染进程提供 ElectronAPI 类型声明
 */

import type { ElectronAPI } from './electron-api.types';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

// 确保这个文件被视为模块
export {};
