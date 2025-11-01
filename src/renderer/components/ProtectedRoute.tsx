import React from 'react';
import { Navigate } from 'react-router-dom';

import { ConnectionStatus } from '../../shared/types/evolution-api.types';
import { useConnectionState } from '../features/whatsapp/contexts/ConnectionStateContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * 🔥 修复：ProtectedRoute - 保护需要登录才能访问的路由
 * 增强逻辑以处理会话恢复期间的中间状态，避免闪烁
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { connectionState } = useConnectionState();

  // 🔥 修复：处理中间状态，避免会话恢复期间的页面跳转闪烁
  const isTransitioning =
    connectionState.status === ConnectionStatus.INITIALIZING ||
    connectionState.status === ConnectionStatus.CONNECTING;

  // 如果正在连接中或初始化中，显示加载状态而不是立即重定向
  if (isTransitioning) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div
          style={{
            width: '50px',
            height: '50px',
            border: '5px solid #f3f3f3',
            borderTop: '5px solid #25D366',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <p style={{ color: '#666', fontSize: '16px' }}>
          {connectionState.status === ConnectionStatus.INITIALIZING
            ? '正在恢复会话...'
            : '正在连接 WhatsApp...'}
        </p>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  // 如果明确处于未连接或错误状态，且会话无效，则重定向
  if (
    (connectionState.status === ConnectionStatus.DISCONNECTED ||
      connectionState.status === ConnectionStatus.ERROR) &&
    !connectionState.sessionValid
  ) {
    return <Navigate to="/setup" replace />;
  }

  // 已连接，渲染子组件
  return <>{children}</>;
};
