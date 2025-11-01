import type { BrowserWindow } from 'electron';

import { databaseService } from './database.service';
import type { MessageService } from './message.service';

/**
 * 消息重试服务
 * 后台定时重试失败的消息
 */
export class MessageRetryService {
  private messageService: MessageService | null = null;

  private mainWindow: BrowserWindow | null = null;

  private retryIntervalId: NodeJS.Timeout | null = null;

  private isRunning: boolean = false;

  private retryIntervalMs: number = 60000; // 每分钟检查一次

  private currentInstanceName: string | null = null;

  constructor(messageService: MessageService) {
    this.messageService = messageService;
  }

  /**
   * 设置主窗口引用
   */
  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  /**
   * 设置当前实例名
   */
  setInstanceName(instanceName: string): void {
    this.currentInstanceName = instanceName;
  }

  /**
   * 启动后台重试服务
   */
  start(): void {
    if (this.isRunning) {
      console.log('[MessageRetryService] Service already running');
      return;
    }

    console.log('[MessageRetryService] 🚀 Starting retry service');
    this.isRunning = true;

    // 立即执行一次重试检查
    void this.processFailedMessages();

    // 定时执行重试检查
    this.retryIntervalId = setInterval(() => {
      void this.processFailedMessages();
    }, this.retryIntervalMs);
  }

  /**
   * 停止后台重试服务
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    console.log('[MessageRetryService] 🛑 Stopping retry service');
    this.isRunning = false;

    if (this.retryIntervalId) {
      clearInterval(this.retryIntervalId);
      this.retryIntervalId = null;
    }
  }

  /**
   * 处理失败消息队列
   */
  private async processFailedMessages(): Promise<void> {
    if (!this.messageService || !this.currentInstanceName) {
      console.log('[MessageRetryService] Service not fully initialized');
      return;
    }

    try {
      // 获取所有失败消息
      const failedMessages = databaseService.getFailedMessages();

      if (failedMessages.length === 0) {
        console.log('[MessageRetryService] No failed messages to retry');
        return;
      }

      console.log(`[MessageRetryService] Processing ${failedMessages.length} failed messages`);

      // 收集需要重试的消息
      const messagesToRetry = failedMessages.filter(failed => {
        // 检查是否超过最大重试次数
        if (failed.retry_count >= failed.max_retries) {
          console.log(
            `[MessageRetryService] Message ${failed.message_id} exceeded max retries, skipping`,
          );
          return false;
        }

        // 检查是否需要等待（避免频繁重试）
        if (failed.last_retry_time) {
          const timeSinceLastRetry = Date.now() - failed.last_retry_time;
          const minRetryInterval = 30000; // 至少等待30秒
          if (timeSinceLastRetry < minRetryInterval) {
            return false;
          }
        }

        return true;
      });

      // 批量重试消息（顺序执行以避免过载）
      for (const failed of messagesToRetry) {
        // eslint-disable-next-line no-await-in-loop
        await this.retryMessage(failed);
      }
    } catch (error) {
      console.error('[MessageRetryService] Error processing failed messages:', error);
    }
  }

  /**
   * 重试单个消息
   */
  private async retryMessage(failed: {
    id: string;
    message_id: string;
    chat_id: string;
    content: string;
    retry_count: number;
  }): Promise<void> {
    if (!this.messageService || !this.currentInstanceName) {
      return;
    }

    try {
      console.log(`[MessageRetryService] Retrying message ${failed.message_id} (attempt ${failed.retry_count + 1})`);

      // 更新重试计数
      databaseService.updateFailedMessageRetryCount(failed.message_id, failed.retry_count + 1);

      // 尝试发送
      const message = await this.messageService.sendTextMessage(
        failed.chat_id,
        failed.content,
        this.currentInstanceName,
      );

      // 发送成功，从失败队列中移除
      databaseService.removeFailedMessage(failed.message_id);
      console.log(`[MessageRetryService] ✅ Message ${failed.message_id} sent successfully`);

      // 通知渲染进程消息发送成功
      if (this.mainWindow) {
        this.mainWindow.webContents.send('message:retry-success', {
          messageId: failed.message_id,
          newMessage: message,
        });
      }
    } catch (error) {
      console.error(`[MessageRetryService] ❌ Failed to retry message ${failed.message_id}:`, error);
    }
  }

  /**
   * 手动重试特定消息
   */
  async manualRetry(messageId: string): Promise<void> {
    if (!this.messageService || !this.currentInstanceName) {
      throw new Error('Service not initialized');
    }

    // 从失败队列中查找消息
    const failedMessages = databaseService.getFailedMessages();
    const failed = failedMessages.find(f => f.message_id === messageId);

    if (!failed) {
      throw new Error(`Failed message not found: ${messageId}`);
    }

    await this.retryMessage(failed);
  }
}
