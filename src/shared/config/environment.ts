// 环境配置管理

export interface IEnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  ELECTRON_IS_DEV: boolean;
  LOG_LEVEL: string;
  DEV_SERVER_PORT: number;
  DEV_SERVER_HOST: string;
  HOT_RELOAD: boolean;
  DEV_TOOLS: boolean;
  // Evolution API 配置
  EVOLUTION_API_BASE_URL: string;
  EVOLUTION_API_KEY: string;
  EVOLUTION_INSTANCE_PREFIX: string;
  // 加密配置
  ENCRYPTION_KEY: string;
}

class Environment {
  private static instance: Environment;

  private config: IEnvironmentConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  static getInstance(): Environment {
    if (!Environment.instance) {
      Environment.instance = new Environment();
    }
    return Environment.instance;
  }

  // eslint-disable-next-line class-methods-use-this
  private loadConfig(): IEnvironmentConfig {
    // 从环境变量读取配置
    const nodeEnv = (
      process.env.NODE_ENV as 'development' | 'production' | 'test'
    ) ?? 'development';
    const electronIsDev = process.env.ELECTRON_IS_DEV === 'true';
    const logLevel = process.env.LOG_LEVEL ?? (
      nodeEnv === 'development' ? 'debug' : 'warn'
    );
    const devServerPort = parseInt(process.env.DEV_SERVER_PORT ?? '3000', 10);
    const devServerHost = process.env.DEV_SERVER_HOST ?? 'localhost';
    const hotReload = process.env.HOT_RELOAD === 'true';
    const devTools = process.env.DEV_TOOLS === 'true';

    // Evolution API 配置
    const evolutionAPIBaseURL = process.env.EVOLUTION_API_BASE_URL ?? 'http://localhost:8080';
    const evolutionAPIKey = process.env.EVOLUTION_API_KEY ?? '';
    const evolutionInstancePrefix = process.env.EVOLUTION_INSTANCE_PREFIX ?? 'whatsapp_';

    // 加密配置
    const encryptionKey = process.env.ENCRYPTION_KEY ?? '';

    return {
      NODE_ENV: nodeEnv,
      ELECTRON_IS_DEV: electronIsDev || nodeEnv === 'development',
      LOG_LEVEL: logLevel,
      DEV_SERVER_PORT: devServerPort,
      DEV_SERVER_HOST: devServerHost,
      HOT_RELOAD: hotReload || nodeEnv === 'development',
      DEV_TOOLS: devTools || nodeEnv === 'development',
      EVOLUTION_API_BASE_URL: evolutionAPIBaseURL,
      EVOLUTION_API_KEY: evolutionAPIKey,
      EVOLUTION_INSTANCE_PREFIX: evolutionInstancePrefix,
      ENCRYPTION_KEY: encryptionKey,
    };
  }

  getConfig(): IEnvironmentConfig {
    return { ...this.config };
  }

  isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }

  isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  isTest(): boolean {
    return this.config.NODE_ENV === 'test';
  }

  getDevServerUrl(): string {
    return `http://${this.config.DEV_SERVER_HOST}:${this.config.DEV_SERVER_PORT}`;
  }

  getLogLevel(): string {
    return this.config.LOG_LEVEL;
  }

  shouldUseHotReload(): boolean {
    return this.config.HOT_RELOAD;
  }

  shouldShowDevTools(): boolean {
    return this.config.DEV_TOOLS;
  }

  // Evolution API 配置获取
  getEvolutionAPIBaseURL(): string {
    return this.config.EVOLUTION_API_BASE_URL;
  }

  getEvolutionAPIKey(): string {
    return this.config.EVOLUTION_API_KEY;
  }

  getEvolutionInstancePrefix(): string {
    return this.config.EVOLUTION_INSTANCE_PREFIX;
  }

  getEncryptionKey(): string {
    return this.config.ENCRYPTION_KEY;
  }

  // 获取应用程序数据目录
  static getAppDataPath(): string {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require, no-restricted-syntax
    const { app } = require('electron');
    return app.getPath('userData');
  }

  // 获取日志文件路径
  static getLogPath(): string {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require, no-restricted-syntax
    const { app } = require('electron');
    const appDataPath = app.getPath('userData');
    return `${appDataPath}/logs`;
  }

  // 获取缓存目录
  static getCachePath(): string {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require, no-restricted-syntax
    const { app } = require('electron');
    return app.getPath('cache');
  }
}

// 导出单例实例
export const environment = Environment.getInstance();
