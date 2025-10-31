import { environment } from './environment';

// Mock process.env
const originalEnv = process.env;

describe('Environment', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should load default configuration', () => {
    // Set NODE_ENV explicitly since Jest sets it to 'test'
    process.env.NODE_ENV = 'development';
    delete process.env.ELECTRON_IS_DEV;
    delete process.env.LOG_LEVEL;
    delete process.env.DEV_SERVER_PORT;
    delete process.env.DEV_SERVER_HOST;
    delete process.env.HOT_RELOAD;
    delete process.env.DEV_TOOLS;

    // Re-import to get new instance with updated env
    const { environment: testEnvironment } = require('./environment');
    const env = testEnvironment.getConfig();

    expect(env).toMatchObject({
      NODE_ENV: 'development',
      ELECTRON_IS_DEV: true,
      LOG_LEVEL: 'debug',
      DEV_SERVER_PORT: 3000,
      DEV_SERVER_HOST: 'localhost',
      HOT_RELOAD: true,
      DEV_TOOLS: true,
    });
  });

  it('should load production configuration', () => {
    process.env.NODE_ENV = 'production';
    process.env.ELECTRON_IS_DEV = 'false';
    process.env.LOG_LEVEL = 'error';
    process.env.HOT_RELOAD = 'false';
    process.env.DEV_TOOLS = 'false';

    // Re-import to get new instance
    const { environment: prodEnvironment } = require('./environment');
    const env = prodEnvironment.getConfig();

    expect(env).toMatchObject({
      NODE_ENV: 'production',
      ELECTRON_IS_DEV: false,
      LOG_LEVEL: 'error',
      HOT_RELOAD: false,
      DEV_TOOLS: false,
    });
  });

  it('should parse custom server configuration', () => {
    process.env.DEV_SERVER_PORT = '8080';
    process.env.DEV_SERVER_HOST = '0.0.0.0';

    // Re-import to get new instance
    const { environment: customEnvironment } = require('./environment');
    const env = customEnvironment.getConfig();

    expect(env.DEV_SERVER_PORT).toBe(8080);
    expect(env.DEV_SERVER_HOST).toBe('0.0.0.0');
  });

  it('should detect development environment', () => {
    process.env.NODE_ENV = 'development';
    const { environment: devEnvironment } = require('./environment');

    expect(devEnvironment.isDevelopment()).toBe(true);
    expect(devEnvironment.isProduction()).toBe(false);
    expect(devEnvironment.isTest()).toBe(false);
  });

  it('should detect production environment', () => {
    process.env.NODE_ENV = 'production';
    const { environment: prodEnvironment } = require('./environment');

    expect(prodEnvironment.isDevelopment()).toBe(false);
    expect(prodEnvironment.isProduction()).toBe(true);
    expect(prodEnvironment.isTest()).toBe(false);
  });

  it('should detect test environment', () => {
    process.env.NODE_ENV = 'test';
    const { environment: testEnvironment } = require('./environment');

    expect(testEnvironment.isDevelopment()).toBe(false);
    expect(testEnvironment.isProduction()).toBe(false);
    expect(testEnvironment.isTest()).toBe(true);
  });

  it('should generate dev server URL', () => {
    process.env.DEV_SERVER_PORT = '3000';
    process.env.DEV_SERVER_HOST = 'localhost';

    const { environment: urlEnvironment } = require('./environment');
    const url = urlEnvironment.getDevServerUrl();

    expect(url).toBe('http://localhost:3000');
  });

  it('should generate dev server URL with custom host and port', () => {
    process.env.DEV_SERVER_PORT = '8080';
    process.env.DEV_SERVER_HOST = '192.168.1.100';

    const { environment: customUrlEnvironment } = require('./environment');
    const url = customUrlEnvironment.getDevServerUrl();

    expect(url).toBe('http://192.168.1.100:8080');
  });

  it('should get log level', () => {
    process.env.LOG_LEVEL = 'warn';

    const { environment: logEnvironment } = require('./environment');
    const logLevel = logEnvironment.getLogLevel();

    expect(logLevel).toBe('warn');
  });

  it('should check hot reload setting', () => {
    process.env.HOT_RELOAD = 'true';

    const { environment: hotReloadEnvironment } = require('./environment');
    const shouldUseHotReload = hotReloadEnvironment.shouldUseHotReload();

    expect(shouldUseHotReload).toBe(true);
  });

  it('should check dev tools setting', () => {
    process.env.DEV_TOOLS = 'false';

    const { environment: devToolsEnvironment } = require('./environment');
    const shouldShowDevTools = devToolsEnvironment.shouldShowDevTools();

    expect(shouldShowDevTools).toBe(false);
  });

  it('should handle invalid port number', () => {
    process.env.DEV_SERVER_PORT = 'invalid';

    const { environment: invalidPortEnvironment } = require('./environment');
    const config = invalidPortEnvironment.getConfig();

    expect(config.DEV_SERVER_PORT).toBeNaN();
  });

  it('should provide immutable configuration', () => {
    const config1 = environment.getConfig();
    const config2 = environment.getConfig();

    // Should be different objects (immutable)
    expect(config1).not.toBe(config2);

    // But have same values
    expect(config1).toEqual(config2);
  });
});
