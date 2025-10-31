// 全局类型定义

// 应用程序状态
export interface AppState {
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

// 窗口状态
export interface WindowState {
  isMaximized: boolean;
  isMinimized: boolean;
  isFocused: boolean;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// 应用程序配置
export interface AppConfig {
  development: boolean;
  version: string;
  platform: string;
  electronVersion: string;
  nodeVersion: string;
  chromeVersion: string;
}

// IPC消息类型
export interface IPCMessage {
  channel: string;
  data?: any;
  timestamp: number;
}

// 错误类型
export interface AppError {
  code: string;
  message: string;
  stack?: string;
  timestamp: number;
}

// 日志级别
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

// 日志条目
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  data?: any;
}

// 主题类型
export type Theme = 'light' | 'dark' | 'system';

// 用户设置
export interface UserSettings {
  theme: Theme;
  language: string;
  autoStart: boolean;
  notifications: boolean;
  minimizeToTray: boolean;
}

// API响应类型
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}
