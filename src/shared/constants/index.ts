// 应用程序常量

// 应用信息
export const APP_CONFIG = {
  NAME: 'WhatsApp语言增强层',
  VERSION: '1.0.0',
  DESCRIPTION: '基于Electron的WhatsApp语言增强桌面应用',
  AUTHOR: 'BMad Team',
  HOMEPAGE: 'https://github.com/bmad/whatsapp-language-enhancement',
} as const;

// 窗口配置
export const WINDOW_CONFIG = {
  DEFAULT_WIDTH: 1200,
  DEFAULT_HEIGHT: 800,
  MIN_WIDTH: 800,
  MIN_HEIGHT: 600,
  TITLE_BAR_HEIGHT: 32,
} as const;

// 主题配置
export const THEME_CONFIG = {
  LIGHT: {
    PRIMARY: '#2c3e50',
    SECONDARY: '#34495e',
    ACCENT: '#3498db',
    SUCCESS: '#27ae60',
    WARNING: '#f39c12',
    ERROR: '#e74c3c',
    BACKGROUND: '#ffffff',
    SURFACE: '#ecf0f1',
    TEXT: '#2c3e50',
    TEXT_SECONDARY: '#7f8c8d',
  },
  DARK: {
    PRIMARY: '#ecf0f1',
    SECONDARY: '#bdc3c7',
    ACCENT: '#3498db',
    SUCCESS: '#27ae60',
    WARNING: '#f39c12',
    ERROR: '#e74c3c',
    BACKGROUND: '#2c3e50',
    SURFACE: '#34495e',
    TEXT: '#ecf0f1',
    TEXT_SECONDARY: '#bdc3c7',
  },
} as const;

// 语言配置
export const LANGUAGES = {
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  'en-US': 'English',
  'ja-JP': '日本語',
  'ko-KR': '한국어',
  'es-ES': 'Español',
  'fr-FR': 'Français',
  'de-DE': 'Deutsch',
  'ru-RU': 'Русский',
  'pt-BR': 'Português',
} as const;

// IPC频道
export const IPC_CHANNELS = {
  // 应用程序
  APP_GET_VERSION: 'app:getVersion',
  APP_GET_PLATFORM: 'app:getPlatform',
  APP_QUIT: 'app:quit',

  // 窗口
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
  WINDOW_FOCUS: 'window:focus',
  WINDOW_BLUR: 'window:blur',

  // 对话框
  DIALOG_SHOW_MESSAGE_BOX: 'dialog:showMessageBox',
  DIALOG_SHOW_OPEN_DIALOG: 'dialog:showOpenDialog',
  DIALOG_SHOW_SAVE_DIALOG: 'dialog:showSaveDialog',

  // Shell
  SHELL_OPEN_EXTERNAL: 'shell:openExternal',
  SHELL_OPEN_PATH: 'shell:openPath',

  // 文件系统
  FS_READ_FILE: 'fs:readFile',
  FS_WRITE_FILE: 'fs:writeFile',
  FS_EXISTS: 'fs:exists',

  // 更新
  UPDATE_AVAILABLE: 'app-update-available',
  UPDATE_DOWNLOADED: 'app-update-downloaded',
  UPDATE_ERROR: 'app-update-error',

  // 通知
  NOTIFICATION_SHOW: 'notification:show',
} as const;

// 错误代码
export const ERROR_CODES = {
  // 通用错误
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',

  // 文件错误
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_READ_ERROR: 'FILE_READ_ERROR',
  FILE_WRITE_ERROR: 'FILE_WRITE_ERROR',
  FILE_PERMISSION_ERROR: 'FILE_PERMISSION_ERROR',

  // API错误
  API_ERROR: 'API_ERROR',
  API_AUTH_ERROR: 'API_AUTH_ERROR',
  API_RATE_LIMIT_ERROR: 'API_RATE_LIMIT_ERROR',

  // 配置错误
  CONFIG_ERROR: 'CONFIG_ERROR',
  CONFIG_MISSING: 'CONFIG_MISSING',
  CONFIG_INVALID: 'CONFIG_INVALID',

  // 窗口错误
  WINDOW_ERROR: 'WINDOW_ERROR',
  WINDOW_DESTROYED: 'WINDOW_DESTROYED',

  // 初始化错误
  INIT_ERROR: 'INIT_ERROR',
  INIT_TIMEOUT: 'INIT_TIMEOUT',
} as const;

// 存储键
export const STORAGE_KEYS = {
  USER_SETTINGS: 'user-settings',
  WINDOW_STATE: 'window-state',
  APP_CONFIG: 'app-config',
  THEME: 'theme',
  LANGUAGE: 'language',
  AUTH_TOKEN: 'auth-token',
  USER_DATA: 'user-data',
  CACHE: 'cache',
} as const;

// 文件路径
export const PATHS = {
  USER_DATA: 'userData',
  APP_DATA: 'appData',
  TEMP: 'temp',
  HOME: 'home',
  DESKTOP: 'desktop',
  DOCUMENTS: 'documents',
  DOWNLOADS: 'downloads',
} as const;

// 网络配置
export const NETWORK_CONFIG = {
  TIMEOUT: 30000, // 30秒
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1秒
  RATE_LIMIT_DELAY: 1000, // 1秒
} as const;

// 日志配置
export const LOG_CONFIG = {
  MAX_LOGS: 1000,
  MAX_LOG_SIZE: 1024 * 1024, // 1MB
  LOG_LEVEL: 'info',
} as const;

// 开发配置
export const DEV_CONFIG = {
  HOT_RELOAD: true,
  DEV_TOOLS: true,
  LOG_LEVEL: 'debug',
} as const;

// 生产配置
export const PROD_CONFIG = {
  HOT_RELOAD: false,
  DEV_TOOLS: false,
  LOG_LEVEL: 'warn',
} as const;
