// 加载环境变量 - 必须在所有其他导入之前
import * as path from 'path';

import * as dotenv from 'dotenv';
import {
  app, BrowserWindow, Menu, shell, ipcMain, dialog,
} from 'electron';
// import * as isDev from 'electron-is-dev'; // Temporarily disabled for testing

import { registerIPCHandlers, cleanupEvolutionAPI } from './ipc-handlers';

// 根据 NODE_ENV 加载对应的 .env 文件
const envFile = process.env.NODE_ENV === 'production'
  ? '.env.production'
  : '.env.development';
dotenv.config({ path: path.resolve(__dirname, '../../', envFile) });

console.log('[Environment] Loaded environment from:', envFile);
console.log('[Environment] Evolution API Base URL:', process.env.EVOLUTION_API_BASE_URL);
console.log('[Environment] Evolution API Key configured:', !!process.env.EVOLUTION_API_KEY);

class Application {
  private mainWindow: BrowserWindow | null = null;

  constructor() {
    this.initializeApp();
  }

  private initializeApp(): void {
    // 设置应用程序用户模型ID (Windows)
    if (process.platform === 'win32') {
      app.setAppUserModelId('com.bmad.whatsapp-language-enhancement');
    }

    // 应用程序事件监听
    void app.whenReady().then(() => this.createMainWindow());

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      }
      app.on('before-quit', () => {
      // 清理 Evolution API 服务
        cleanupEvolutionAPI();
      });
    });
  }

  private createMainWindow(): void {
    // 创建浏览器窗口
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      show: false,
      autoHideMenuBar: true,
      icon: path.join(__dirname, '../../assets/icon.png'), // 可选的应用图标
      webPreferences: {
        nodeIntegration: false, // 安全：禁用Node.js集成
        contextIsolation: true, // 安全：启用上下文隔离
        // enableRemoteModule: false, // 在新版本Electron中已移除
        preload: path.join(__dirname, '../preload/preload.js'), // 预加载脚本
        webSecurity: true, // 启用Web安全
        allowRunningInsecureContent: false, // 禁止运行不安全内容
        experimentalFeatures: false, // 禁用实验性功能
      },
    });

    // 窗口事件处理
    this.mainWindow.once('ready-to-show', () => {
      if (this.mainWindow) {
        this.mainWindow.show();

        // 开发环境下打开DevTools
        if (process.env.NODE_ENV === 'development') {
          this.mainWindow.webContents.openDevTools();
        }
      }
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // before-unload 事件在渲染进程中处理

    // 加载应用程序
    this.loadApplication();
    this.setupMenu();
    this.setupIpcHandlers();

    // 注册 Evolution API IPC handlers
    registerIPCHandlers();
  }

  private loadApplication(): void {
    // Load production index.html
    const indexPath = path.join(__dirname, '../renderer/index.html');
    void this.mainWindow?.loadFile(indexPath);
  }

  private setupMenu(): void {
    if (process.platform === 'darwin') {
      const template = Application.buildDarwinTemplate();
      const menu = Menu.buildFromTemplate(template);
      Menu.setApplicationMenu(menu);
    } else {
      const template = Application.buildDefaultTemplate();
      const menu = Menu.buildFromTemplate(template);
      this.mainWindow?.setMenu(menu);
    }
  }

  private static buildDarwinTemplate(): Electron.MenuItemConstructorOptions[] {
    return [
      {
        label: 'WhatsApp语言增强层',
        submenu: [
          { role: 'about', label: '关于 WhatsApp语言增强层' },
          { type: 'separator' },
          { role: 'services', label: '服务' },
          { type: 'separator' },
          { role: 'hide', label: '隐藏 WhatsApp语言增强层' },
          { role: 'hideOthers', label: '隐藏其他' },
          { role: 'unhide', label: '显示全部' },
          { type: 'separator' },
          { role: 'quit', label: '退出 WhatsApp语言增强层' },
        ],
      },
      {
        label: '编辑',
        submenu: [
          { role: 'undo', label: '撤销' },
          { role: 'redo', label: '重做' },
          { type: 'separator' },
          { role: 'cut', label: '剪切' },
          { role: 'copy', label: '复制' },
          { role: 'paste', label: '粘贴' },
          { role: 'selectAll', label: '全选' },
        ],
      },
      {
        label: '视图',
        submenu: [
          { role: 'reload', label: '重新加载' },
          { role: 'forceReload', label: '强制重新加载' },
          { role: 'toggleDevTools', label: '开发者工具' },
          { type: 'separator' },
          { role: 'resetZoom', label: '实际大小' },
          { role: 'zoomIn', label: '放大' },
          { role: 'zoomOut', label: '缩小' },
          { type: 'separator' },
          { role: 'togglefullscreen', label: '全屏' },
        ],
      },
      {
        label: '窗口',
        submenu: [
          { role: 'minimize', label: '最小化' },
          { role: 'close', label: '关闭' },
        ],
      },
    ];
  }

  private static buildDefaultTemplate(): Electron.MenuItemConstructorOptions[] {
    return [
      {
        label: '文件',
        submenu: [
          { role: 'quit', label: '退出' },
        ],
      },
      {
        label: '编辑',
        submenu: [
          { role: 'undo', label: '撤销' },
          { role: 'redo', label: '重做' },
          { type: 'separator' },
          { role: 'cut', label: '剪切' },
          { role: 'copy', label: '复制' },
          { role: 'paste', label: '粘贴' },
          { role: 'selectAll', label: '全选' },
        ],
      },
      {
        label: '视图',
        submenu: [
          { role: 'reload', label: '重新加载' },
          { role: 'forceReload', label: '强制重新加载' },
          { role: 'toggleDevTools', label: '开发者工具' },
          { type: 'separator' },
          { role: 'resetZoom', label: '实际大小' },
          { role: 'zoomIn', label: '放大' },
          { role: 'zoomOut', label: '缩小' },
          { type: 'separator' },
          { role: 'togglefullscreen', label: '全屏' },
        ],
      },
    ];
  }

  private setupIpcHandlers(): void {
    // IPC处理器设置
    ipcMain.handle('app:getVersion', () => app.getVersion());

    ipcMain.handle('app:getPlatform', () => process.platform);

    ipcMain.handle('window:minimize', () => {
      this.mainWindow?.minimize();
    });

    ipcMain.handle('window:maximize', () => {
      if (this.mainWindow?.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow?.maximize();
      }
    });

    ipcMain.handle('window:close', () => {
      this.mainWindow?.close();
    });

    ipcMain.handle('dialog:showMessageBox', async (_, options) => {
      if (this.mainWindow) {
        const result = await dialog.showMessageBox(this.mainWindow, options);
        return result;
      }
      throw new Error('No main window available');
    });

    // 处理外部链接
    ipcMain.handle('shell:openExternal', async (_, url: string) => {
      await shell.openExternal(url);
    });
  }
}

// 创建应用程序实例
const appInstance = new Application();

// 防止tree-shaking移除
export { appInstance };
