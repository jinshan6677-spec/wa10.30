import React from 'react';

import { ConnectionStatus } from '../../../../shared/types/evolution-api.types';
import { useConnectionState } from '../contexts/ConnectionStateContext';

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 16px',
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #dee2e6',
    fontSize: '14px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  statusSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statusIcon: {
    fontSize: '16px',
    fontWeight: 'bold',
    animation: 'pulse 2s infinite',
  },
  statusText: {
    fontWeight: '500',
    color: '#333',
  },
  detailsSection: {
    flex: 1,
    textAlign: 'center',
  },
  detailsText: {
    fontSize: '12px',
    color: '#666',
  },
  timestampSection: {
    marginLeft: 'auto',
  },
  timestampText: {
    fontSize: '11px',
    color: '#999',
  },
};

export const ConnectionStatusBar: React.FC = () => {
  const { connectionState } = useConnectionState();

  const getStatusInfo = () => {
    switch (connectionState.status) {
      case ConnectionStatus.CONNECTED:
        return {
          text: '已连接',
          color: '#25D366',
          icon: '●',
          details: connectionState.instanceKey ?? '',
        };
      case ConnectionStatus.CONNECTING:
        return {
          text: '连接中',
          color: '#FFA500',
          icon: '◐',
          details:
            connectionState.reconnectAttempts > 0
              ? `重连尝试 ${connectionState.reconnectAttempts}/5`
              : '',
        };
      case ConnectionStatus.QR_CODE_READY:
        return {
          text: '等待扫码',
          color: '#2196F3',
          icon: '◯',
          details: '请扫描二维码',
        };
      case ConnectionStatus.ERROR:
        return {
          text: '连接失败',
          color: '#dc3545',
          icon: '✗',
          details: connectionState.error?.message ?? '未知错误',
        };
      case ConnectionStatus.DISCONNECTED:
        return {
          text: '未连接',
          color: '#6c757d',
          icon: '○',
          details: '',
        };
      case ConnectionStatus.INITIALIZING:
      default:
        return {
          text: '初始化中',
          color: '#6c757d',
          icon: '◌',
          details: '',
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div style={styles.container}>
      <div style={styles.statusSection}>
        <span style={{ ...styles.statusIcon, color: statusInfo.color }}>{statusInfo.icon}</span>
        <span style={styles.statusText}>{statusInfo.text}</span>
      </div>

      {statusInfo.details && (
        <div style={styles.detailsSection}>
          <span style={styles.detailsText}>{statusInfo.details}</span>
        </div>
      )}

      {connectionState.lastConnected && connectionState.status === ConnectionStatus.CONNECTED && (
        <div style={styles.timestampSection}>
          <span style={styles.timestampText}>
            最后连接: {new Date(connectionState.lastConnected).toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
};
