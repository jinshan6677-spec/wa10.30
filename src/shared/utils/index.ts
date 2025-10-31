import type { LogEntry, AppError } from '../types';
import { LogLevel } from '../types';

// 日志工具类
export class Logger {
  private static instance: Logger;

  private logs: LogEntry[] = [];

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private log(level: LogLevel, message: string, data?: any): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      data,
    };

    this.logs.push(entry);

    // 控制台输出
    const timestamp = new Date(entry.timestamp).toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logMessage, data);
        break;
      case LogLevel.INFO:
        console.info(logMessage, data);
        break;
      case LogLevel.WARN:
        console.warn(logMessage, data);
        break;
      case LogLevel.ERROR:
        console.error(logMessage, data);
        break;
      default:
        console.log(logMessage, data);
        break;
    }
  }

  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, message, data);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }
}

// 错误处理工具
export class ErrorHandler {
  private static logger = Logger.getInstance();

  static handleError(error: Error | AppError, context?: string): AppError {
    const appError: AppError = {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
    };

    // 如果是自定义错误
    if ('code' in error) {
      appError.code = error.code;
    }

    // 记录错误日志
    const contextMessage = context ? `[${context}] ${appError.message}` : appError.message;
    this.logger.error(contextMessage, { error: appError });

    return appError;
  }

  static createError(code: string, message: string, data?: any): AppError {
    const error: AppError = {
      code,
      message,
      timestamp: Date.now(),
    };

    if (data) {
      (error as any).data = data;
    }

    return error;
  }
}

// 格式化工具
export class Formatter {
  static formatFileSize(bytes: number): string {
    if (bytes === 0) {
      return '0 Bytes';
    }

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  }

  static formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}小时 ${minutes % 60}分钟`;
    }
    if (minutes > 0) {
      return `${minutes}分钟 ${seconds % 60}秒`;
    }
    return `${seconds}秒`;
  }

  static formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleString('zh-CN');
  }

  static truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return `${text.substring(0, maxLength - 3)}...`;
  }
}

// 验证工具
export class Validator {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidUrl(url: string): boolean {
    try {
      // eslint-disable-next-line no-new
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone);
  }

  static isNotEmpty(value: string | null | undefined): boolean {
    return value !== null && value !== undefined && value.trim().length > 0;
  }

  static isValidVersion(version: string): boolean {
    const versionRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/;
    return versionRegex.test(version);
  }
}

// 存储工具
export class Storage {
  private static prefix = 'whatsapp-enhancement-';

  static setItem(key: string, value: any): void {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(this.prefix + key, serializedValue);
    } catch (error) {
      Logger.getInstance().error('存储数据失败', { key, error });
    }
  }

  static getItem<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (item === null) {
        return defaultValue ?? null;
      }
      return JSON.parse(item);
    } catch (error) {
      Logger.getInstance().error('读取数据失败', { key, error });
      return defaultValue ?? null;
    }
  }

  static removeItem(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      Logger.getInstance().error('删除数据失败', { key, error });
    }
  }

  static clear(): void {
    try {
      const keys = Object.keys(localStorage).filter((key) => key.startsWith(this.prefix));
      keys.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      Logger.getInstance().error('清空存储失败', { error });
    }
  }
}

// 防抖和节流
export function debounce<T extends (
  ...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

export function throttle<T extends (
  ...args: any[]) => any>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

// 导出默认实例
export const logger = Logger.getInstance();
