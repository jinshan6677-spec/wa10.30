# API 文档

WhatsApp语言增强层应用程序的API文档。

## 📚 目录

- [主进程API](#主进程api)
- [渲染进程API](#渲染进程api)
- [预加载API](#预加载api)
- [共享工具API](#共享工具api)
- [类型定义](#类型定义)

## 🔧 主进程API

### 窗口管理

#### `window:minimize`
最小化应用程序窗口。

**参数:** 无

**返回值:** `Promise<void>`

**示例:**
```typescript
await window.electronAPI.minimizeWindow();
```

#### `window:maximize`
最大化或还原应用程序窗口。

**参数:** 无

**返回值:** `Promise<void>`

**示例:**
```typescript
await window.electronAPI.maximizeWindow();
```

#### `window:close`
关闭应用程序窗口。

**参数:** 无

**返回值:** `Promise<void>`

**示例:**
```typescript
await window.electronAPI.closeWindow();
```

### 应用信息

#### `app:getVersion`
获取应用程序版本。

**参数:** 无

**返回值:** `Promise<string>`

**示例:**
```typescript
const version = await window.electronAPI.getVersion();
console.log(`App version: ${version}`);
```

#### `app:getPlatform`
获取运行平台信息。

**参数:** 无

**返回值:** `Promise<string>`

**示例:**
```typescript
const platform = await window.electronAPI.getPlatform();
console.log(`Running on: ${platform}`);
```

### 对话框

#### `dialog:showMessageBox`
显示消息对话框。

**参数:** `Electron.MessageBoxOptions`

**返回值:** `Promise<Electron.MessageBoxReturnValue>`

**示例:**
```typescript
const result = await window.electronAPI.showMessageBox({
  type: 'question',
  buttons: ['是', '否'],
  defaultId: 0,
  title: '确认',
  message: '确定要删除此项目吗？'
});

if (result.response === 0) {
  // 用户点击了"是"
}
```

### 外部链接

#### `shell:openExternal`
在默认浏览器中打开外部链接。

**参数:** `url: string`

**返回值:** `Promise<void>`

**示例:**
```typescript
await window.electronAPI.openExternal('https://github.com/bmad/whatsapp-language-enhancement');
```

## 🎨 渲染进程API

### 组件API

#### App组件
主应用程序组件。

**Props:**
```typescript
interface AppProps {
  // 目前无props
}
```

**示例:**
```typescript
import App from './App';

// 在index.tsx中渲染
ReactDOM.render(<App />, document.getElementById('root'));
```

### Hooks

#### useAppInfo
获取应用程序信息。

**返回值:**
```typescript
interface AppInfo {
  version: string;
  platform: string;
}
```

**示例:**
```typescript
const { version, platform } = useAppInfo();
```

#### useWindowControl
窗口控制Hook。

**返回值:**
```typescript
interface WindowControls {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
}
```

**示例:**
```typescript
const { minimize, maximize, close } = useWindowControl();
```

## 🔗 预加载API

### 暴露的API接口

#### ElectronAPI
主接口，包含所有可用的API方法。

```typescript
interface ElectronAPI {
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

  // 事件监听
  on: (channel: string, callback: (...args: any[]) => void) => void;
  off: (channel: string, callback: (...args: any[]) => void) => void;
  removeAllListeners: (channel: string) => void;
}
```

### 使用示例

```typescript
// 在渲染进程中使用
const getUserInfo = async () => {
  const version = await window.electronAPI.getVersion();
  const platform = await window.electronAPI.getPlatform();

  return { version, platform };
};

// 监听事件
window.electronAPI.on('window-focus', () => {
  console.log('Window is focused');
});

// 清理监听器
window.electronAPI.removeAllListeners('window-focus');
```

## 🛠️ 共享工具API

### 日志工具

#### Logger
日志记录工具类。

**方法:**

##### `debug(message: string, data?: any): void`
记录调试信息。

**参数:**
- `message`: 日志消息
- `data`: 可选的附加数据

**示例:**
```typescript
import { logger } from '@/shared/utils';

logger.debug('User login attempt', { userId: '123' });
```

##### `info(message: string, data?: any): void`
记录信息。

**示例:**
```typescript
logger.info('Application started', { version: '1.0.0' });
```

##### `warn(message: string, data?: any): void`
记录警告。

**示例:**
```typescript
logger.warn('Deprecated API used', { api: 'oldMethod' });
```

##### `error(message: string, data?: any): void`
记录错误。

**示例:**
```typescript
logger.error('Failed to fetch user', { userId: '123', error: 'Network error' });
```

### 错误处理

#### ErrorHandler
错误处理工具类。

**方法:**

##### `handleError(error: Error | AppError, context?: string): AppError`
处理和记录错误。

**参数:**
- `error`: 错误对象
- `context`: 错误上下文

**返回值:** `AppError`

**示例:**
```typescript
import { ErrorHandler } from '@/shared/utils';

try {
  await riskyOperation();
} catch (error) {
  const appError = ErrorHandler.handleError(error, 'UserAuthentication');
  // 处理错误
}
```

##### `createError(code: string, message: string, data?: any): AppError`
创建应用程序错误。

**示例:**
```typescript
const error = ErrorHandler.createError('USER_NOT_FOUND', 'User not found', { userId: '123' });
```

### 格式化工具

#### Formatter
数据格式化工具类。

**方法:**

##### `formatFileSize(bytes: number): string`
格式化文件大小。

**示例:**
```typescript
const size = Formatter.formatFileSize(1024 * 1024); // "1 MB"
```

##### `formatDuration(milliseconds: number): string`
格式化时间长度。

**示例:**
```typescript
const duration = Formatter.formatDuration(3600000); // "1小时"
```

##### `formatTimestamp(timestamp: number): string`
格式化时间戳。

**示例:**
```typescript
const formatted = Formatter.formatTimestamp(Date.now()); // "2024/1/1 12:00:00"
```

### 验证工具

#### Validator
数据验证工具类。

**方法:**

##### `isValidEmail(email: string): boolean`
验证邮箱格式。

**示例:**
```typescript
const isValid = Validator.isValidEmail('user@example.com'); // true
```

##### `isValidUrl(url: string): boolean`
验证URL格式。

**示例:**
```typescript
const isValid = Validator.isValidUrl('https://example.com'); // true
```

##### `isValidPhone(phone: string): boolean`
验证手机号格式。

**示例:**
```typescript
const isValid = Validator.isValidPhone('+1234567890'); // true
```

### 存储工具

#### Storage
本地存储工具类。

**方法:**

##### `setItem(key: string, value: any): void`
存储数据。

**示例:**
```typescript
Storage.setItem('userPreferences', { theme: 'dark', language: 'zh-CN' });
```

##### `getItem<T>(key: string, defaultValue?: T): T | null`
读取数据。

**示例:**
```typescript
const preferences = Storage.getItem('userPreferences', { theme: 'light' });
```

##### `removeItem(key: string): void`
删除数据。

**示例:**
```typescript
Storage.removeItem('userPreferences');
```

##### `clear(): void`
清空所有数据。

**示例:**
```typescript
Storage.clear();
```

### 工具函数

#### `debounce<T>(func: T, wait: number): T`
防抖函数。

**参数:**
- `func`: 要防抖的函数
- `wait`: 等待时间（毫秒）

**示例:**
```typescript
import { debounce } from '@/shared/utils';

const debouncedSearch = debounce((query: string) => {
  // 执行搜索
}, 300);
```

#### `throttle<T>(func: T, limit: number): T`
节流函数。

**参数:**
- `func`: 要节流的函数
- `limit`: 限制时间（毫秒）

**示例:**
```typescript
import { throttle } from '@/shared/utils';

const throttledScroll = throttle(() => {
  // 处理滚动
}, 100);
```

## 📋 类型定义

### 应用状态

```typescript
interface AppState {
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}
```

### 窗口状态

```typescript
interface WindowState {
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
```

### 应用配置

```typescript
interface AppConfig {
  development: boolean;
  version: string;
  platform: string;
  electronVersion: string;
  nodeVersion: string;
  chromeVersion: string;
}
```

### 错误类型

```typescript
interface AppError {
  code: string;
  message: string;
  stack?: string;
  timestamp: number;
}
```

### 日志类型

```typescript
enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  data?: any;
}
```

### 用户设置

```typescript
interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  autoStart: boolean;
  notifications: boolean;
  minimizeToTray: boolean;
}
```

### API响应

```typescript
interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}
```

## 🔄 事件系统

### 可用事件

#### `window-focus`
窗口获得焦点时触发。

#### `window-blur`
窗口失去焦点时触发。

#### `app-update-available`
应用更新可用时触发。

#### `app-update-downloaded`
应用更新下载完成时触发。

### 事件监听示例

```typescript
// 监听窗口焦点事件
window.electronAPI.on('window-focus', () => {
  console.log('Window gained focus');
});

// 监听更新事件
window.electronAPI.on('app-update-available', (info) => {
  console.log('Update available:', info);
});

// 清理监听器
const cleanup = () => {
  window.electronAPI.removeAllListeners('window-focus');
  window.electronAPI.removeAllListeners('app-update-available');
};
```

## 🔐 安全考虑

### API安全
- 所有IPC通信都通过预加载脚本进行安全验证
- 禁用了Node.js集成在渲染进程中
- 使用contextBridge进行安全的API暴露
- 实施了内容安全策略(CSP)

### 数据验证
- 所有API输入都经过验证
- 使用TypeScript进行类型检查
- 实施了错误边界处理
- 敏感数据加密存储

## 📝 使用最佳实践

### 错误处理
```typescript
// ✅ 好的做法
const fetchUserData = async (userId: string): Promise<User | null> => {
  try {
    const user = await userService.findById(userId);
    return user;
  } catch (error) {
    logger.error('Failed to fetch user data', { userId, error });
    return null;
  }
};

// ❌ 避免的做法
const fetchUserData = async (userId: string) => {
  return userService.findById(userId); // 没有错误处理
};
```

### 类型安全
```typescript
// ✅ 明确的类型定义
const updateUser = async (id: string, data: Partial<User>): Promise<User> => {
  return userService.update(id, data);
};

// ❌ 避免使用any
const updateUser = async (id: string, data: any): Promise<any> => {
  return userService.update(id, data);
};
```

### 性能优化
```typescript
// ✅ 使用防抖
const debouncedSearch = debounce((query: string) => {
  performSearch(query);
}, 300);

// ✅ 使用记忆化
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data);
}, [data]);
```

---

如有API相关问题，请创建Issue或联系开发团队。