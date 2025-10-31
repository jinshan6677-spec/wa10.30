import {
  Logger,
  ErrorHandler,
  Formatter,
  Validator,
  Storage,
  debounce,
  throttle,
  logger,
} from './index';

describe('Utils', () => {
  beforeEach(() => {
    // 清理日志
    Logger.getInstance().clearLogs();
    // 清理存储
    Storage.clear();
    // 重置console mock
    jest.clearAllMocks();
  });

  describe('Logger', () => {
    it('should be a singleton', () => {
      const logger1 = Logger.getInstance();
      const logger2 = Logger.getInstance();
      expect(logger1).toBe(logger2);
    });

    it('should log debug messages', () => {
      const consoleDebug = jest.spyOn(console, 'debug');
      logger.debug('Test debug message', { data: 'test' });

      expect(consoleDebug).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG] Test debug message'),
        { data: 'test' },
      );
    });

    it('should log error messages', () => {
      const consoleError = jest.spyOn(console, 'error');
      logger.error('Test error message', { error: 'test' });

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] Test error message'),
        { error: 'test' },
      );
    });

    it('should retrieve logs', () => {
      logger.info('Test message');
      const logs = logger.getLogs();

      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        level: 'info',
        message: 'Test message',
        timestamp: expect.any(Number),
      });
    });

    it('should clear logs', () => {
      logger.info('Test message');
      logger.clearLogs();
      const logs = logger.getLogs();

      expect(logs).toHaveLength(0);
    });
  });

  describe('ErrorHandler', () => {
    it('should handle Error objects', () => {
      const error = new Error('Test error');
      const appError = ErrorHandler.handleError(error, 'TestContext');

      expect(appError).toMatchObject({
        code: 'UNKNOWN_ERROR',
        message: 'Test error',
        stack: expect.any(String),
        timestamp: expect.any(Number),
      });
    });

    it('should handle AppError objects', () => {
      const customError = {
        code: 'CUSTOM_ERROR',
        message: 'Custom error',
        stack: 'Custom stack',
        timestamp: Date.now(),
      };
      const appError = ErrorHandler.handleError(customError, 'TestContext');

      expect(appError.code).toBe('CUSTOM_ERROR');
    });

    it('should create custom errors', () => {
      const error = ErrorHandler.createError('TEST_ERROR', 'Test message', { key: 'value' });

      expect(error).toMatchObject({
        code: 'TEST_ERROR',
        message: 'Test message',
        timestamp: expect.any(Number),
        data: { key: 'value' },
      });
    });
  });

  describe('Formatter', () => {
    it('should format file size', () => {
      expect(Formatter.formatFileSize(0)).toBe('0 Bytes');
      expect(Formatter.formatFileSize(1024)).toBe('1 KB');
      expect(Formatter.formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(Formatter.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should format duration', () => {
      expect(Formatter.formatDuration(1000)).toBe('1秒');
      expect(Formatter.formatDuration(60 * 1000)).toBe('1分钟 0秒');
      expect(Formatter.formatDuration(3600 * 1000)).toBe('1小时 0分钟');
    });

    it('should format timestamp', () => {
      const timestamp = Date.now();
      const formatted = Formatter.formatTimestamp(timestamp);

      expect(formatted).toMatch(/\d{4}\/\d{1,2}\/\d{1,2} \d{1,2}:\d{2}:\d{2}/);
    });

    it('should truncate text', () => {
      const longText = 'This is a very long text that should be truncated';
      const truncated = Formatter.truncateText(longText, 20);

      expect(truncated).toBe('This is a very lo...');
      expect(Formatter.truncateText('Short text', 20)).toBe('Short text');
    });
  });

  describe('Validator', () => {
    it('should validate email addresses', () => {
      expect(Validator.isValidEmail('test@example.com')).toBe(true);
      expect(Validator.isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
      expect(Validator.isValidEmail('invalid-email')).toBe(false);
      expect(Validator.isValidEmail('')).toBe(false);
    });

    it('should validate URLs', () => {
      expect(Validator.isValidUrl('https://example.com')).toBe(true);
      expect(Validator.isValidUrl('http://localhost:3000')).toBe(true);
      expect(Validator.isValidUrl('invalid-url')).toBe(false);
    });

    it('should validate phone numbers', () => {
      expect(Validator.isValidPhone('+1234567890')).toBe(true);
      expect(Validator.isValidPhone('1234567890')).toBe(true);
      expect(Validator.isValidPhone('invalid-phone')).toBe(false);
    });

    it('should check if value is not empty', () => {
      expect(Validator.isNotEmpty('test')).toBe(true);
      expect(Validator.isNotEmpty('  test  ')).toBe(true);
      expect(Validator.isNotEmpty('')).toBe(false);
      expect(Validator.isNotEmpty('   ')).toBe(false);
      expect(Validator.isNotEmpty(null)).toBe(false);
      expect(Validator.isNotEmpty(undefined)).toBe(false);
    });

    it('should validate version numbers', () => {
      expect(Validator.isValidVersion('1.0.0')).toBe(true);
      expect(Validator.isValidVersion('1.0.0-beta')).toBe(true);
      expect(Validator.isValidVersion('1.0')).toBe(false);
      expect(Validator.isValidVersion('invalid')).toBe(false);
    });
  });

  describe('Storage', () => {
    beforeEach(() => {
      Storage.clear();
    });

    it('should set and get items', () => {
      const testData = { name: 'test', value: 123 };
      Storage.setItem('test-key', testData);

      const retrieved = Storage.getItem('test-key');
      expect(retrieved).toEqual(testData);
    });

    it('should return default value for non-existent items', () => {
      const result = Storage.getItem('non-existent', 'default');
      expect(result).toBe('default');
    });

    it('should remove items', () => {
      Storage.setItem('test-key', 'test-value');
      Storage.removeItem('test-key');

      const result = Storage.getItem('test-key');
      expect(result).toBeNull();
    });

    it('should clear all items', () => {
      Storage.setItem('key1', 'value1');
      Storage.setItem('key2', 'value2');
      Storage.clear();

      expect(Storage.getItem('key1')).toBeNull();
      expect(Storage.getItem('key2')).toBeNull();
    });
  });

  describe('debounce', () => {
    jest.useFakeTimers();

    it('should delay function execution', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should cancel previous calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    afterEach(() => {
      jest.clearAllTimers();
    });
  });

  describe('throttle', () => {
    jest.useFakeTimers();

    it('should limit function execution rate', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(mockFn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(100);
      throttledFn();

      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    afterEach(() => {
      jest.clearAllTimers();
    });
  });
});
