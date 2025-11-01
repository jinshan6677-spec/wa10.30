import axios from 'axios';
import { io } from 'socket.io-client';

import { EvolutionAPIService } from './evolution-api.service';

// Mock axios 和 socket.io-client
jest.mock('axios');
jest.mock('socket.io-client');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedIo = io as jest.MockedFunction<typeof io>;

describe('EvolutionAPIService', () => {
  let service: EvolutionAPIService;
  const mockConfig = {
    baseURL: 'http://localhost:8080',
    apiKey: 'test-api-key',
    instancePrefix: 'test_',
  };

  beforeEach(() => {
    // 清除所有 mock
    jest.clearAllMocks();

    // Mock axios.create
    const mockAxiosInstance = {
      post: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    };

    mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance as any);
    mockedAxios.get = jest.fn();

    service = new EvolutionAPIService(mockConfig);
  });

  afterEach(() => {
    service.destroy();
  });

  describe('createInstance', () => {
    it('should create instance successfully', async () => {
      const mockResponse = {
        data: {
          instance: {
            instanceName: 'test_instance',
            status: 'created',
          },
        },
        status: 200,
        config: { url: '/instance/create' },
      };

      const { axiosInstance } = service as any;
      axiosInstance.post.mockResolvedValue(mockResponse);

      const result = await service.createInstance({
        instanceName: 'test_instance',
        qrcode: true,
      });

      expect(result).toEqual(mockResponse.data);
      expect(axiosInstance.post).toHaveBeenCalledWith('/instance/create', {
        instanceName: 'test_instance',
        token: undefined,
        qrcode: true,
        number: undefined,
        webhook: undefined,
      });
    });

    it('should handle API error', async () => {
      const mockError = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
        message: 'Request failed',
      };

      const { axiosInstance } = service as any;
      axiosInstance.post.mockRejectedValue(mockError);

      await expect(
        service.createInstance({
          instanceName: 'test_instance',
          qrcode: true,
        }),
      ).rejects.toThrow('Internal server error');
    });
  });

  describe('getQRCode', () => {
    it('should retrieve QR code successfully', async () => {
      const mockResponse = {
        data: {
          base64: 'mock-base64-qr-code',
        },
        status: 200,
        config: { url: '/instance/connect/test_instance' },
      };

      const { axiosInstance } = service as any;
      axiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.getQRCode('test_instance');

      expect(result).toEqual(mockResponse.data);
      expect(axiosInstance.get).toHaveBeenCalledWith('/instance/connect/test_instance');
    });
  });

  describe('getConnectionStatus', () => {
    it('should get connection status successfully', async () => {
      const mockResponse = {
        data: {
          state: 'open',
        },
        status: 200,
        config: { url: '/instance/connectionState/test_instance' },
      };

      const { axiosInstance } = service as any;
      axiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.getConnectionStatus('test_instance');

      expect(result).toEqual({ state: 'open' });
      expect(axiosInstance.get).toHaveBeenCalledWith('/instance/connectionState/test_instance');
    });
  });

  describe('disconnect', () => {
    it('should disconnect with logout', async () => {
      const { axiosInstance } = service as any;
      axiosInstance.delete.mockResolvedValue({ status: 200 });

      await service.disconnect('test_instance', { logout: true });

      expect(axiosInstance.delete).toHaveBeenCalledWith('/instance/logout/test_instance');
    });

    it('should remove instance', async () => {
      const { axiosInstance } = service as any;
      axiosInstance.delete.mockResolvedValue({ status: 200 });

      await service.disconnect('test_instance', {
        logout: true,
        removeInstance: true,
      });

      expect(axiosInstance.delete).toHaveBeenCalledWith('/instance/logout/test_instance');
      expect(axiosInstance.delete).toHaveBeenCalledWith('/instance/delete/test_instance');
    });
  });

  describe('WebSocket', () => {
    it('should connect WebSocket', () => {
      const mockSocket = {
        on: jest.fn(),
        onAny: jest.fn(),
        connected: false,
        connect: jest.fn(),
        disconnect: jest.fn(),
      };

      mockedIo.mockReturnValue(mockSocket as any);

      service.connectWebSocket('test_instance');

      // Evolution API v2全局WebSocket模式：连接到基础URL，使用extraHeaders传递apikey
      expect(mockedIo).toHaveBeenCalledWith(mockConfig.baseURL, {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 500,
        reconnectionDelayMax: 5000,
        timeout: 15000,
        extraHeaders: {
          apikey: mockConfig.apiKey,
        },
        auth: {
          apikey: mockConfig.apiKey,
        },
      });

      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
    });

    it('should disconnect WebSocket', () => {
      const mockSocket = {
        on: jest.fn(),
        connected: true,
        disconnect: jest.fn(),
      };

      mockedIo.mockReturnValue(mockSocket as any);
      service.connectWebSocket('test_instance');

      service.disconnectWebSocket();

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('Event handling', () => {
    it('should register and emit events', () => {
      const mockHandler = jest.fn();

      service.on('test-event', mockHandler);
      (service as any).emit('test-event', { data: 'test' });

      expect(mockHandler).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should unregister events', () => {
      const mockHandler = jest.fn();

      service.on('test-event', mockHandler);
      service.off('test-event', mockHandler);
      (service as any).emit('test-event', { data: 'test' });

      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('healthCheck', () => {
    it('should return true when API is healthy', async () => {
      mockedAxios.get.mockResolvedValue({ status: 200 });

      const result = await service.healthCheck();

      expect(result).toBe(true);
      expect(mockedAxios.get).toHaveBeenCalledWith(`${mockConfig.baseURL}/`, {
        timeout: 5000,
      });
    });

    it('should return false when API is unhealthy', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Connection failed'));

      const result = await service.healthCheck();

      expect(result).toBe(false);
    });
  });
});
