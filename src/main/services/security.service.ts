import * as crypto from 'crypto';

import * as keytar from 'keytar';

/**
 * 安全服务类
 * 处理API密钥的安全存储和加密操作
 */
export class SecurityService {
  private static instance: SecurityService;

  private readonly serviceName = 'whatsapp-language-enhancement';

  private readonly algorithm = 'aes-256-cbc';

  private encryptionKey: Buffer | null = null;

  private constructor() {
    // 私有构造函数,确保单例
  }

  static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  /**
   * 初始化加密密钥
   */
  initializeEncryptionKey(key: string): void {
    if (!key) {
      throw new Error('Encryption key cannot be empty');
    }

    // 使用 SHA-256 将密钥转换为固定长度的 Buffer
    this.encryptionKey = crypto.createHash('sha256').update(key).digest();
  }

  /**
   * 存储 API 密钥到系统密钥链
   */
  async storeAPIKey(account: string, apiKey: string): Promise<void> {
    try {
      await keytar.setPassword(this.serviceName, account, apiKey);
      console.log(`[Security] API key stored for account: ${account}`);
    } catch (error) {
      console.error('[Security] Failed to store API key:', error);
      throw new Error(`Failed to store API key: ${(error as Error).message}`);
    }
  }

  /**
   * 从系统密钥链检索 API 密钥
   */
  async retrieveAPIKey(account: string): Promise<string | null> {
    try {
      const apiKey = await keytar.getPassword(this.serviceName, account);
      if (apiKey) {
        console.log(`[Security] API key retrieved for account: ${account}`);
      } else {
        console.warn(`[Security] No API key found for account: ${account}`);
      }
      return apiKey;
    } catch (error) {
      console.error('[Security] Failed to retrieve API key:', error);
      throw new Error(`Failed to retrieve API key: ${(error as Error).message}`);
    }
  }

  /**
   * 删除系统密钥链中的 API 密钥
   */
  async deleteAPIKey(account: string): Promise<boolean> {
    try {
      const result = await keytar.deletePassword(this.serviceName, account);
      if (result) {
        console.log(`[Security] API key deleted for account: ${account}`);
      } else {
        console.warn(`[Security] No API key found to delete for account: ${account}`);
      }
      return result;
    } catch (error) {
      console.error('[Security] Failed to delete API key:', error);
      throw new Error(`Failed to delete API key: ${(error as Error).message}`);
    }
  }

  /**
   * 列出所有存储的账户
   */
  async listAccounts(): Promise<string[]> {
    try {
      const credentials = await keytar.findCredentials(this.serviceName);
      return credentials.map(cred => cred.account);
    } catch (error) {
      console.error('[Security] Failed to list accounts:', error);
      throw new Error(`Failed to list accounts: ${(error as Error).message}`);
    }
  }

  /**
   * 加密数据
   */
  encrypt(data: string): string {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized. Call initializeEncryptionKey() first.');
    }

    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // 将 IV 和加密数据组合
      return `${iv.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.error('[Security] Encryption failed:', error);
      throw new Error(`Encryption failed: ${(error as Error).message}`);
    }
  }

  /**
   * 解密数据
   */
  decrypt(encryptedData: string): string {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized. Call initializeEncryptionKey() first.');
    }

    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 2) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];

      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('[Security] Decryption failed:', error);
      throw new Error(`Decryption failed: ${(error as Error).message}`);
    }
  }

  /**
   * 生成随机密钥
   */
  static generateRandomKey(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * 哈希数据 (SHA-256)
   */
  static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * 验证哈希
   */
  static verifyHash(data: string, hash: string): boolean {
    const computedHash = SecurityService.hash(data);
    return computedHash === hash;
  }

  /**
   * 清理敏感数据 (覆盖内存)
   * 注意: JavaScript 不保证立即清理,但这是最佳实践
   */
  static clearSensitiveData(data: string | Buffer): void {
    if (typeof data === 'string') {
      // eslint-disable-next-line no-param-reassign
      data = '';
    } else if (Buffer.isBuffer(data)) {
      data.fill(0);
    }
  }
}

// 导出单例实例
export const securityService = SecurityService.getInstance();
