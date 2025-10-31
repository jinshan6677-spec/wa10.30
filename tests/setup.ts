// Jest测试环境设置

// 模拟Electron API
const mockElectronAPI = {
  getVersion: jest.fn(() => Promise.resolve('1.0.0')),
  getPlatform: jest.fn(() => Promise.resolve('win32')),
  minimizeWindow: jest.fn(() => Promise.resolve()),
  maximizeWindow: jest.fn(() => Promise.resolve()),
  closeWindow: jest.fn(() => Promise.resolve()),
  showMessageBox: jest.fn(() => Promise.resolve({ response: 0 })),
  openExternal: jest.fn(() => Promise.resolve()),
  on: jest.fn(),
  off: jest.fn(),
  removeAllListeners: jest.fn(),
};

// 暴露模拟API到全局window对象
Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
});

// 模拟matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// 模拟ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// 模拟localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// 模拟console方法以避免测试输出污染
global.console = {
  ...console,
  // 保留error和warn用于测试验证
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
};

// 设置测试超时
jest.setTimeout(10000);