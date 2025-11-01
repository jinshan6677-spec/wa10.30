import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

import './App.css';
import { ConnectionStatus } from '../shared/types/evolution-api.types';

import { MainLayout } from './components/organisms/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { UserSettingsProvider } from './contexts/UserSettingsContext';
import { ConnectionStatusBar } from './features/whatsapp/components/ConnectionStatusBar';
import { QRCodeDisplay } from './features/whatsapp/components/QRCodeDisplay';
import { ChatProvider } from './features/whatsapp/contexts/ChatContext';
import {
  ConnectionStateProvider,
  useConnectionState,
} from './features/whatsapp/contexts/ConnectionStateContext';
import { MessageProvider } from './features/whatsapp/contexts/MessageContext';
import { useEvolutionAPI } from './features/whatsapp/hooks/useEvolutionAPI';
import { ThemeProvider } from './shared/contexts/ThemeContext';

interface AppInfo {
  version: string;
  platform: string;
}

const WhatsAppConnection: React.FC = () => {
  const INSTANCE_NAME = 'whatsapp_main';
  const { isLoading, refreshQRCode, disconnect, connectWithHybridStrategy } = useEvolutionAPI();
  const { connectionState } = useConnectionState();
  const [hasInitialized, setHasInitialized] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // 🔥 修复：自动初始化连接 - 只在会话无效且未连接时执行
  useEffect(() => {
    // 等待会话恢复逻辑完成（通过检查 sessionValid 和 status）
    if (hasInitialized) {
      return undefined;
    }

    // 🔥 关键修复：如果已经连接，跳过自动连接（说明会话已恢复）
    if (connectionState.status === ConnectionStatus.CONNECTED) {
      setHasInitialized(true);
      return undefined;
    }

    // 🔥 新增：如果正在连接中，也跳过（避免重复连接）
    if (connectionState.status === ConnectionStatus.CONNECTING) {
      setHasInitialized(true);
      return undefined;
    }

    // 🔥 新增：如果有 QR 码，说明连接流程已开始，跳过
    if (connectionState.status === ConnectionStatus.QR_CODE_READY) {
      setHasInitialized(true);
      return undefined;
    }

    // 只在明确处于断开状态时，才尝试连接
    if (connectionState.status === ConnectionStatus.DISCONNECTED) {
      // 🔥 新增：延迟500ms以等待会话恢复逻辑完成
      const timer = setTimeout(() => {
        // 再次检查状态，如果仍是 DISCONNECTED 才连接
        if (connectionState.status === ConnectionStatus.DISCONNECTED) {
          setHasInitialized(true);

          const initConnection = async () => {
            try {
              await connectWithHybridStrategy(INSTANCE_NAME);
            } catch (error) {
              console.error('[WhatsAppConnection] Connection error:', error);
            }
          };

          void initConnection();
        } else {
          setHasInitialized(true);
        }
      }, 500);

      return () => {
        clearTimeout(timer);
      };
    }

    // 🔥 修复：确保所有代码路径都有返回值
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasInitialized, connectionState.status]);

  // 🔥 修复：登录成功后自动跳转到聊天页面 - 只在 setup 页面时跳转
  // 使用setTimeout避免React Router v6的状态竞争条件
  useEffect(() => {
    // 只在连接成功且当前在 /setup 页面时跳转
    if (
      connectionState.status === ConnectionStatus.CONNECTED &&
      location.pathname === '/setup'
    ) {
      // 🔥 关键修复：延迟导航到事件队列末尾，确保状态更新完成
      setTimeout(() => {
        navigate('/chat', { replace: true });
      }, 0);
    }
  }, [connectionState.status, location.pathname, navigate]); // 🔥 修复：添加 navigate 到依赖项

  const handleConnect = () => {
    void (async () => {
      try {
        await connectWithHybridStrategy(INSTANCE_NAME);
      } catch (error) {
        console.error('[WhatsAppConnection] Connection error:', error);
      }
    })();
  };

  const handleRefreshQR = () => {
    void (async () => {
      try {
        await refreshQRCode(INSTANCE_NAME);
      } catch (error) {
        console.error('[WhatsAppConnection] Refresh QR error:', error);
      }
    })();
  };

  const handleDisconnect = () => {
    void (async () => {
      try {
        await disconnect(INSTANCE_NAME);
      } catch (error) {
        console.error('[WhatsAppConnection] Disconnect error:', error);
      }
    })();
  };

  return (
    <div style={{ padding: '20px' }}>
      <div
        style={{
          marginBottom: '20px',
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={handleConnect}
          disabled={isLoading || connectionState.status === ConnectionStatus.CONNECTED}
          style={{
            padding: '10px 20px',
            backgroundColor: '#25D366',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor:
              isLoading || connectionState.status === ConnectionStatus.CONNECTED
                ? 'not-allowed'
                : 'pointer',
            opacity: isLoading || connectionState.status === ConnectionStatus.CONNECTED ? 0.6 : 1,
          }}
        >
          {isLoading ? '连接中...' : '连接 WhatsApp'}
        </button>

        <button
          onClick={handleDisconnect}
          disabled={isLoading || connectionState.status === ConnectionStatus.DISCONNECTED}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor:
              isLoading || connectionState.status === ConnectionStatus.DISCONNECTED
                ? 'not-allowed'
                : 'pointer',
            opacity:
              isLoading || connectionState.status === ConnectionStatus.DISCONNECTED ? 0.6 : 1,
          }}
        >
          断开连接
        </button>
      </div>

      <QRCodeDisplay instanceName={INSTANCE_NAME} onRefresh={handleRefreshQR} />
    </div>
  );
};

const App: React.FC = () => {
  const [appInfo, setAppInfo] = useState<AppInfo>({
    version: '加载中...',
    platform: '未知',
  });

  useEffect(() => {
    // 获取应用信息
    const getAppInfo = async () => {
      // 检查是否在Electron环境中
      if (!window.electronAPI) {
        console.warn('Not running in Electron environment');
        return;
      }

      try {
        const version = await window.electronAPI.getVersion();
        const platform = await window.electronAPI.getPlatform();
        setAppInfo({ version, platform });
      } catch (error) {
        console.error('获取应用信息失败:', error);
      }
    };

    void getAppInfo();
  }, []);

  const handleMinimize = () => {
    void window.electronAPI.minimizeWindow();
  };

  const handleMaximize = () => {
    void window.electronAPI.maximizeWindow();
  };

  const handleClose = () => {
    void window.electronAPI.closeWindow();
  };

  return (
    <ThemeProvider>
      <UserSettingsProvider>
        <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ConnectionStateProvider>
            <ChatProvider>
              <MessageProvider>
                {/* eslint-disable-next-line @typescript-eslint/no-use-before-define */}
                <AppContent appInfo={appInfo} handleMinimize={handleMinimize} handleMaximize={handleMaximize} handleClose={handleClose} />
              </MessageProvider>
            </ChatProvider>
          </ConnectionStateProvider>
        </HashRouter>
      </UserSettingsProvider>
    </ThemeProvider>
  );
};

// 🔥 新增：AppContent 组件 - 处理全局路由逻辑
const AppContent: React.FC<{
  appInfo: AppInfo;
  handleMinimize: () => void;
  handleMaximize: () => void;
  handleClose: () => void;
}> = ({ appInfo, handleMinimize, handleMaximize, handleClose }) => {
  const { connectionState } = useConnectionState();
  const navigate = useNavigate();
  const location = useLocation();

  // 🔥 全局路由守卫：如果已连接但在 /setup 页面，自动跳转到 /chat
  useEffect(() => {
    if (
      connectionState.status === ConnectionStatus.CONNECTED &&
      location.pathname === '/setup'
    ) {
      // 🔥 关键修复：延迟导航到事件队列末尾，确保状态更新完成
      setTimeout(() => {
        navigate('/chat', { replace: true });
      }, 0);
    }
  }, [connectionState.status, location.pathname, navigate]);

  // 🔥 修复：退出登录时自动跳转回 /setup 页面
  useEffect(() => {
    if (
      connectionState.status === ConnectionStatus.DISCONNECTED &&
      !connectionState.sessionValid &&
      location.pathname === '/chat'
    ) {
      // 🔥 关键修复：延迟导航到事件队列末尾，确保状态更新完成
      setTimeout(() => {
        navigate('/setup', { replace: true });
      }, 0);
    }
  }, [connectionState.status, connectionState.sessionValid, location.pathname, navigate]);

  // 🔥 新增：错误状态且会话无效时，自动跳转到登录页
  useEffect(() => {
    if (
      connectionState.status === ConnectionStatus.ERROR &&
      !connectionState.sessionValid &&
      location.pathname === '/chat'
    ) {
      // 🔥 关键修复：延迟导航到事件队列末尾，确保状态更新完成
      setTimeout(() => {
        navigate('/setup', { replace: true });
      }, 0);
    }
  }, [connectionState.status, connectionState.sessionValid, location.pathname, navigate, connectionState.error]);

  return (
    <div className="app">
      {/* 自定义标题栏 */}
      <header className="title-bar">
        <div className="title-bar-left">
          <span className="app-title">WhatsApp语言增强层</span>
          <span style={{ marginLeft: '10px', fontSize: '12px', color: '#666' }}>
            v{appInfo.version}
          </span>
        </div>
        <div className="title-bar-right">
          <button className="title-bar-button minimize" onClick={handleMinimize}>
            −
          </button>
          <button className="title-bar-button maximize" onClick={handleMaximize}>
            □
          </button>
          <button className="title-bar-button close" onClick={handleClose}>
            ×
          </button>
        </div>
      </header>

      {/* 连接状态栏 */}
      <ConnectionStatusBar />

      {/* 路由配置 */}
      <Routes>
        <Route
          path="/setup"
          element={
            <main className="main-content">
              <div className="welcome-container">
                <h1>WhatsApp 连接</h1>
                <p style={{ color: '#666', marginBottom: '20px' }}>
                        连接您的 WhatsApp 账号以开始使用翻译功能
                </p>

                <WhatsAppConnection />

                <div className="development-notice" style={{ marginTop: '40px' }}>
                  <h3>Evolution API 集成完成</h3>
                  <p>
                          ✅ Docker Compose 配置
                    <br />
                          ✅ API 服务类和 WebSocket 通信
                    <br />
                          ✅ 系统密钥链安全存储
                    <br />
                          ✅ 二维码显示和自动刷新
                    <br />
                          ✅ 连接状态管理
                    <br />
                          ✅ 自动重连机制
                    <br />
                          ✅ 登录成功自动跳转
                  </p>
                </div>
              </div>
            </main>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <main className="main-content" style={{ padding: 0 }}>
                <MainLayout />
              </main>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/setup" replace />} />
      </Routes>
    </div>
  );
};

export { App };
