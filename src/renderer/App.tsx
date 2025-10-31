import React, { useEffect, useState } from 'react';

import './App.css';
import { ConnectionStatus } from '../shared/types/evolution-api.types';

import { ConnectionStatusBar } from './features/whatsapp/components/ConnectionStatusBar';
import { QRCodeDisplay } from './features/whatsapp/components/QRCodeDisplay';
import {
  ConnectionStateProvider,
  useConnectionState,
} from './features/whatsapp/contexts/ConnectionStateContext';
import { useEvolutionAPI } from './features/whatsapp/hooks/useEvolutionAPI';

interface AppInfo {
  version: string;
  platform: string;
}

const WhatsAppConnection: React.FC = () => {
  const INSTANCE_NAME = 'whatsapp_main';
  const { isLoading, refreshQRCode, disconnect, connectWithHybridStrategy } = useEvolutionAPI();
  const { connectionState } = useConnectionState();
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    // 自动初始化连接 - 只在首次 DISCONNECTED 状态时执行一次
    if (!hasInitialized && connectionState.status === ConnectionStatus.DISCONNECTED) {
      setHasInitialized(true);

      const initConnection = async () => {
        try {
          console.log('[WhatsAppConnection] Starting WebSocket-only connection...');
          await connectWithHybridStrategy(INSTANCE_NAME);
        } catch (error) {
          console.error('[WhatsAppConnection] Connection error:', error);
        }
      };

      void initConnection();
    }
    // 故意不包含 connectWithHybridStrategy,因为我们只想初始化时执行一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasInitialized, connectionState.status]);

  const handleConnect = () => {
    void (async () => {
      try {
        console.log('[WhatsAppConnection] Manual connection triggered...');
        await connectWithHybridStrategy(INSTANCE_NAME);
      } catch (error) {
        console.error('[WhatsAppConnection] Connection error:', error);
      }
    })();
  };

  const handleRefreshQR = () => {
    void (async () => {
      try {
        console.log('[WhatsAppConnection] Manual QR refresh requested');
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
    <ConnectionStateProvider>
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

        {/* 主要内容区域 */}
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
                <br />✅ 自动重连机制
              </p>
            </div>
          </div>
        </main>
      </div>
    </ConnectionStateProvider>
  );
};

export { App };
