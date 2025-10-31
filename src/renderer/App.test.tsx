import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import '@testing-library/jest-dom';
import { ConnectionStatus } from '../shared/types/evolution-api.types';

import { App } from './App';

// Mock window.electronAPI
const mockElectronAPI = {
  getVersion: jest.fn(() => Promise.resolve('1.0.0')),
  getPlatform: jest.fn(() => Promise.resolve('win32')),
  minimizeWindow: jest.fn(() => Promise.resolve()),
  maximizeWindow: jest.fn(() => Promise.resolve()),
  closeWindow: jest.fn(() => Promise.resolve()),
  showMessageBox: jest.fn(() => Promise.resolve({ response: 0 })),
  openExternal: jest.fn(() => Promise.resolve()),
  evolutionAPI: {
    createInstance: jest.fn(() => Promise.resolve()),
    getQRCode: jest.fn(() => Promise.resolve()),
    disconnect: jest.fn(() => Promise.resolve()),
    connectWebSocket: jest.fn(() => Promise.resolve()),
    disconnectWebSocket: jest.fn(() => Promise.resolve()),
    getConnectionStatus: jest.fn(() => Promise.resolve({ state: 'disconnected' })),
    on: jest.fn(),
    off: jest.fn(),
  },
  on: jest.fn(),
  off: jest.fn(),
  removeAllListeners: jest.fn(),
};

Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
});

// Mock the WhatsApp feature components
jest.mock('./features/whatsapp/components/ConnectionStatusBar', () => ({
  ConnectionStatusBar: () => <div data-testid="connection-status-bar">Connection Status Bar</div>,
}));

jest.mock('./features/whatsapp/components/QRCodeDisplay', () => ({
  QRCodeDisplay: ({ instanceName, onRefresh }: { instanceName: string; onRefresh: () => void }) => (
    <div data-testid="qr-code-display">
      QR Code for {instanceName}
      <button onClick={onRefresh}>Refresh QR</button>
    </div>
  ),
}));

// Mock the useEvolutionAPI hook
jest.mock('./features/whatsapp/hooks/useEvolutionAPI', () => ({
  useEvolutionAPI: () => ({
    isLoading: false,
    createInstance: jest.fn(),
    getQRCode: jest.fn(),
    disconnect: jest.fn(),
    connectWebSocket: jest.fn(),
    disconnectWebSocket: jest.fn(),
    getConnectionStatus: jest.fn(),
  }),
}));

// Mock the ConnectionStateContext
jest.mock('./features/whatsapp/contexts/ConnectionStateContext', () => ({
  ConnectionStateProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useConnectionState: () => ({
    connectionState: {
      status: ConnectionStatus.DISCONNECTED,
      instanceKey: null,
      qrCode: null,
      error: null,
      lastConnected: null,
      reconnectAttempts: 0,
    },
    updateConnectionState: jest.fn(),
    resetConnectionState: jest.fn(),
  }),
}));

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText('WhatsApp语言增强层')).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    render(<App />);
    expect(screen.getByText(/v加载中.../)).toBeInTheDocument();
  });

  it('fetches and displays app info', async () => {
    render(<App />);

    await waitFor(() => {
      expect(mockElectronAPI.getVersion).toHaveBeenCalledTimes(1);
      expect(mockElectronAPI.getPlatform).toHaveBeenCalledTimes(1);
    });
  });

  it('displays version after loading', async () => {
    mockElectronAPI.getVersion.mockResolvedValue('1.0.0');
    mockElectronAPI.getPlatform.mockResolvedValue('win32');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/v1\.0\.0/)).toBeInTheDocument();
    });
  });

  it('renders Evolution API integration status', () => {
    render(<App />);

    expect(screen.getByText('Evolution API 集成完成')).toBeInTheDocument();
    expect(screen.getByText(/Docker Compose 配置/)).toBeInTheDocument();
    expect(screen.getByText(/二维码显示和自动刷新/)).toBeInTheDocument();
    expect(screen.getByText(/自动重连机制/)).toBeInTheDocument();
  });

  it('renders WhatsApp connection section', () => {
    render(<App />);

    expect(screen.getByText('WhatsApp 连接')).toBeInTheDocument();
    expect(screen.getByText(/连接您的 WhatsApp 账号以开始使用翻译功能/)).toBeInTheDocument();
  });

  it('handles window control buttons', () => {
    render(<App />);

    const minimizeButton = screen.getByText('−');
    const maximizeButton = screen.getByText('□');
    const closeButton = screen.getByText('×');

    fireEvent.click(minimizeButton);
    expect(mockElectronAPI.minimizeWindow).toHaveBeenCalledTimes(1);

    fireEvent.click(maximizeButton);
    expect(mockElectronAPI.maximizeWindow).toHaveBeenCalledTimes(1);

    fireEvent.click(closeButton);
    expect(mockElectronAPI.closeWindow).toHaveBeenCalledTimes(1);
  });

  it('handles API errors gracefully', async () => {
    mockElectronAPI.getVersion.mockRejectedValue(new Error('API Error'));
    mockElectronAPI.getPlatform.mockRejectedValue(new Error('API Error'));

    render(<App />);

    await waitFor(() => {
      // Should still render the app without crashing
      expect(screen.getByText('WhatsApp语言增强层')).toBeInTheDocument();
    });
  });

  it('has correct CSS classes and structure', () => {
    const { container } = render(<App />);

    expect(container.querySelector('.app')).toBeInTheDocument();
    expect(container.querySelector('.title-bar')).toBeInTheDocument();
    expect(container.querySelector('.main-content')).toBeInTheDocument();
    expect(container.querySelector('.welcome-container')).toBeInTheDocument();
    expect(container.querySelector('.development-notice')).toBeInTheDocument();
  });

  it('renders ConnectionStatusBar component', () => {
    render(<App />);

    expect(screen.getByTestId('connection-status-bar')).toBeInTheDocument();
  });

  it('renders QRCodeDisplay component', () => {
    render(<App />);

    expect(screen.getByTestId('qr-code-display')).toBeInTheDocument();
    expect(screen.getByText(/QR Code for whatsapp_main/)).toBeInTheDocument();
  });

  it('renders connection control buttons', () => {
    render(<App />);

    expect(screen.getByText('连接 WhatsApp')).toBeInTheDocument();
    expect(screen.getByText('断开连接')).toBeInTheDocument();
  });
});
