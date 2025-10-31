import React, { useEffect, useState } from 'react';

import { ConnectionStatus } from '../../../../shared/types/evolution-api.types';
import { useConnectionState } from '../contexts/ConnectionStateContext';

interface QRCodeDisplayProps {
  instanceName: string;
  onRefresh?: () => void;
  autoRefreshInterval?: number; // 秒
}

// 简单的内联样式 (后续可以迁移到CSS模块或styled-components)
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    minHeight: '400px',
  },
  qrBox: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '30px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    maxWidth: '400px',
    textAlign: 'center',
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#333',
  },
  qrCodeContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
  },
  qrCodeImage: {
    width: '250px',
    height: '250px',
    border: '2px solid #eee',
    borderRadius: '8px',
  },
  infoSection: {
    textAlign: 'left',
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
  },
  instructions: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '8px',
    lineHeight: '1.5',
  },
  timerSection: {
    marginBottom: '20px',
  },
  timerText: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '5px',
  },
  timestampText: {
    fontSize: '12px',
    color: '#999',
  },
  hintText: {
    fontSize: '11px',
    color: '#888',
    fontStyle: 'italic',
    marginTop: '5px',
  },
  refreshButton: {
    backgroundColor: '#25D366',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  loadingBox: {
    textAlign: 'center',
    padding: '40px',
  },
  spinner: {
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #25D366',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 20px',
  },
  loadingTitle: {
    fontSize: '18px',
    color: '#333',
    marginBottom: '10px',
  },
  loadingText: {
    fontSize: '14px',
    color: '#666',
  },
  successBox: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  successIcon: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#25D366',
    color: 'white',
    fontSize: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
  },
  successTitle: {
    fontSize: '24px',
    color: '#333',
    marginBottom: '10px',
  },
  successText: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '10px',
  },
  instanceInfo: {
    fontSize: '12px',
    color: '#999',
  },
  errorBox: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  errorIcon: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#dc3545',
    color: 'white',
    fontSize: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
  },
  errorTitle: {
    fontSize: '24px',
    color: '#333',
    marginBottom: '10px',
  },
  errorText: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '20px',
  },
  retryButton: {
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  instanceName,
  onRefresh,
  autoRefreshInterval = 60,
}) => {
  const { connectionState } = useConnectionState();
  const [secondsRemaining, setSecondsRemaining] = useState(autoRefreshInterval);
  const [qrCodeGeneratedAt, setQRCodeGeneratedAt] = useState<Date | null>(null);

  // 当二维码更新时,重置计时器
  useEffect(() => {
    if (connectionState.qrCode) {
      setQRCodeGeneratedAt(new Date());
      setSecondsRemaining(autoRefreshInterval);
    }
  }, [connectionState.qrCode, autoRefreshInterval]);

  // 自动倒计时显示(仅用于提示,不触发刷新)
  // Evolution API 会自动每40秒左右发送新的 QR 码,无需前端主动刷新
  useEffect(() => {
    if (connectionState.status === ConnectionStatus.QR_CODE_READY && secondsRemaining > 0) {
      const timer = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            // 倒计时结束,重置显示 (Evolution API 会自动发送新 QR)
            // 不再主动调用 onRefresh(),避免与 Evolution API 的自动刷新冲突
            return autoRefreshInterval;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
    return undefined;
  }, [connectionState.status, secondsRemaining, autoRefreshInterval]);

  const handleManualRefresh = () => {
    if (onRefresh) {
      onRefresh();
      setSecondsRemaining(autoRefreshInterval);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 渲染不同状态
  if (connectionState.status === ConnectionStatus.CONNECTED) {
    return (
      <div style={styles.container}>
        <div style={styles.successBox}>
          <div style={styles.successIcon}>✓</div>
          <h3 style={styles.successTitle}>已连接</h3>
          <p style={styles.successText}>WhatsApp 已成功连接</p>
          <p style={styles.instanceInfo}>实例: {instanceName}</p>
        </div>
      </div>
    );
  }

  if (connectionState.status === ConnectionStatus.ERROR) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBox}>
          <div style={styles.errorIcon}>✗</div>
          <h3 style={styles.errorTitle}>连接失败</h3>
          <p style={styles.errorText}>{connectionState.error?.message ?? '未知错误'}</p>
          <button onClick={handleManualRefresh} style={styles.retryButton}>
            重试
          </button>
        </div>
      </div>
    );
  }

  if (connectionState.status === ConnectionStatus.CONNECTING) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingBox}>
          <div style={styles.spinner} />
          <h3 style={styles.loadingTitle}>连接中...</h3>
          <p style={styles.loadingText}>
            {connectionState.reconnectAttempts > 0
              ? `重连尝试 ${connectionState.reconnectAttempts}/5`
              : '正在建立连接'}
          </p>
        </div>
      </div>
    );
  }

  if (!connectionState.qrCode) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingBox}>
          <div style={styles.spinner} />
          <h3 style={styles.loadingTitle}>生成二维码中...</h3>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.qrBox}>
        <h3 style={styles.title}>扫描二维码连接 WhatsApp</h3>

        <div style={styles.qrCodeContainer}>
          <img src={connectionState.qrCode} alt="WhatsApp QR Code" style={styles.qrCodeImage} />
        </div>

        <div style={styles.infoSection}>
          <p style={styles.instructions}>1. 打开 WhatsApp 应用</p>
          <p style={styles.instructions}>
            2. 点击 <strong>设置</strong> → <strong>已连接的设备</strong>
          </p>
          <p style={styles.instructions}>
            3. 点击 <strong>连接设备</strong> 并扫描此二维码
          </p>
        </div>

        <div style={styles.timerSection}>
          <p style={styles.timerText}>
            二维码将在约 <strong>{formatTime(secondsRemaining)}</strong> 后自动更新
          </p>
          {qrCodeGeneratedAt && (
            <p style={styles.timestampText}>生成时间: {qrCodeGeneratedAt.toLocaleTimeString()}</p>
          )}
          <p style={styles.hintText}>注: Evolution API 会自动发送新的二维码</p>
        </div>

        <button onClick={handleManualRefresh} style={styles.refreshButton}>
          手动刷新二维码
        </button>
      </div>
    </div>
  );
};
