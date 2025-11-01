import fs from 'fs';
import path from 'path';

import { app } from 'electron';
import type { Database } from 'sql.js';
import initSqlJs from 'sql.js';

import type { ChatRecord } from '../../shared/types/chat.types';
import type { MessageRecord } from '../../shared/types/message.types';

/**
 * 数据库服务类
 * 管理 SQLite 数据库连接和表结构
 * 使用 sql.js (纯JavaScript SQLite实现,无需原生模块编译)
 */
export class DatabaseService {
  private db: Database | null = null;

  private dbPath: string | null = null;

  private dbName: string;

  constructor(dbName: string = 'whatsapp.db') {
    // 延迟路径初始化，等到 initialize() 时再获取 app.getPath()
    this.dbName = dbName;
  }

  /**
   * 初始化数据库连接和表结构
   * @returns Promise<boolean> - true if successful, false otherwise
   */
  async initialize(): Promise<boolean> {
    if (this.db) {
      console.warn('[Database] Database already initialized');
      return true;
    }

    try {
      // 在 initialize 时才获取路径（确保 app.ready 已触发）
      if (!this.dbPath) {
        const userDataPath = app.getPath('userData');
        this.dbPath = path.join(userDataPath, this.dbName);
        console.log('[Database] Database path:', this.dbPath);
      }

      // 确保目录存在
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // 初始化 sql.js
      const SQL = await initSqlJs();

      // 尝试从文件加载现有数据库
      let dbData: Uint8Array | undefined;
      if (fs.existsSync(this.dbPath)) {
        dbData = fs.readFileSync(this.dbPath);
        console.log('[Database] Loaded existing database from disk');
      }

      // 打开数据库连接
      this.db = new SQL.Database(dbData);

      console.log('[Database] Database connection opened (sql.js)');

      // 创建表结构
      this.createTables();
      this.createIndexes();

      // 保存到磁盘
      this.saveToDisk();

      console.log('[Database] Database initialized successfully (sql.js)');
      return true;
    } catch (error) {
      console.error('[Database] Failed to initialize database:', error);
      console.warn('[Database] ⚠️  App will continue without local database (chat list will fetch from Evolution API)');
      this.db = null;
      return false;
    }
  }

  /**
   * 保存数据库到磁盘
   */
  private saveToDisk(): void {
    if (!this.db || !this.dbPath) {
      return;
    }

    try {
      const data = this.db.export();
      fs.writeFileSync(this.dbPath, data);
    } catch (error) {
      console.error('[Database] Failed to save to disk:', error);
    }
  }

  /**
   * 创建数据库表
   */
  private createTables(): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // 创建聊天表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY,
        whatsapp_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        avatar_url TEXT,
        last_message TEXT,
        last_message_time INTEGER,
        last_message_sender TEXT,
        last_message_status TEXT,
        last_message_is_from_me INTEGER DEFAULT 0,
        unread_count INTEGER DEFAULT 0,
        is_pinned INTEGER DEFAULT 0,
        is_archived INTEGER DEFAULT 0,
        is_group INTEGER DEFAULT 0,
        is_online INTEGER,
        last_seen_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    // 创建消息表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        chat_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        sender_name TEXT NOT NULL,
        sender_avatar TEXT,
        content TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        status TEXT NOT NULL,
        type TEXT DEFAULT 'text',
        is_group_chat INTEGER DEFAULT 0,
        is_own INTEGER DEFAULT 0,
        metadata TEXT,
        quoted_message TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (chat_id) REFERENCES chats(whatsapp_id)
      );
    `);

    // 创建失败消息队列表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS failed_messages (
        id TEXT PRIMARY KEY,
        message_id TEXT NOT NULL,
        chat_id TEXT NOT NULL,
        content TEXT NOT NULL,
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        last_retry_time INTEGER,
        error_message TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (message_id) REFERENCES messages(id)
      );
    `);

    console.log('[Database] Chats, Messages and Failed Messages tables created');
  }

  /**
   * 创建数据库索引（优化查询性能）
   */
  private createIndexes(): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // 索引：whatsapp_id（唯一索引，已在表定义中）
    // 索引：timestamp排序
    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_chats_last_message_time
      ON chats(last_message_time DESC);
    `);

    // 索引：置顶过滤
    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_chats_is_pinned
      ON chats(is_pinned, last_message_time DESC);
    `);

    // 索引：归档过滤
    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_chats_is_archived
      ON chats(is_archived);
    `);

    // 消息表索引
    // 复合索引：chat_id + timestamp 优化消息列表查询和排序
    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_messages_chat_timestamp
      ON messages(chat_id, timestamp DESC);
    `);

    // 索引：timestamp 用于全局消息时间排序
    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_messages_timestamp
      ON messages(timestamp DESC);
    `);

    // 索引：status 用于未读消息过滤
    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_messages_status
      ON messages(status);
    `);

    // 失败消息队列表索引
    // 索引：chat_id 用于查询特定聊天的失败消息
    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_failed_messages_chat
      ON failed_messages(chat_id);
    `);

    // 索引：retry_count 和 last_retry_time 用于重试逻辑
    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_failed_messages_retry
      ON failed_messages(retry_count, last_retry_time);
    `);

    // ⚠️ Note: sql.js默认不包含FTS5支持
    // 搜索功能将使用LIKE fallback实现(见searchChats和searchMessages方法)

    console.log('[Database] Indexes created (FTS5 disabled for sql.js compatibility)');
  }

  /**
   * 获取数据库实例
   */
  getDatabase(): Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * 插入或更新聊天记录（UPSERT）
   */
  upsertChat(chat: ChatRecord): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    this.db.run(
      `
      INSERT INTO chats (
        id, whatsapp_id, name, avatar_url,
        last_message, last_message_time, last_message_sender,
        last_message_status, last_message_is_from_me,
        unread_count, is_pinned, is_archived, is_group,
        is_online, last_seen_at, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?
      )
      ON CONFLICT(whatsapp_id) DO UPDATE SET
        name = excluded.name,
        avatar_url = excluded.avatar_url,
        last_message = excluded.last_message,
        last_message_time = excluded.last_message_time,
        last_message_sender = excluded.last_message_sender,
        last_message_status = excluded.last_message_status,
        last_message_is_from_me = excluded.last_message_is_from_me,
        unread_count = excluded.unread_count,
        is_pinned = excluded.is_pinned,
        is_archived = excluded.is_archived,
        is_group = excluded.is_group,
        is_online = excluded.is_online,
        last_seen_at = excluded.last_seen_at,
        updated_at = excluded.updated_at
    `,
      [
        chat.id,
        chat.whatsapp_id,
        chat.name,
        chat.avatar_url,
        chat.last_message,
        chat.last_message_time,
        chat.last_message_sender,
        chat.last_message_status,
        chat.last_message_is_from_me,
        chat.unread_count,
        chat.is_pinned,
        chat.is_archived,
        chat.is_group,
        chat.is_online,
        chat.last_seen_at,
        chat.created_at,
        chat.updated_at,
      ],
    );

    // 保存到磁盘
    this.saveToDisk();
  }

  /**
   * 批量插入或更新聊天记录
   */
  upsertChats(chats: ChatRecord[]): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // sql.js doesn't need explicit transactions like better-sqlite3
    // Just batch the inserts
    chats.forEach(chat => {
      this.upsertChat(chat);
    });
  }

  /**
   * 获取所有聊天列表
   */
  getAllChats(includeArchived: boolean = false): ChatRecord[] {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const query = includeArchived
      ? 'SELECT * FROM chats ORDER BY is_pinned DESC, last_message_time DESC'
      : 'SELECT * FROM chats WHERE is_archived = 0 ORDER BY is_pinned DESC, last_message_time DESC';

    const stmt = this.db.prepare(query);
    const results: ChatRecord[] = [];

    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as ChatRecord);
    }

    stmt.free();
    return results;
  }

  /**
   * 根据 whatsapp_id 获取聊天
   */
  getChatByWhatsappId(whatsappId: string): ChatRecord | undefined {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare('SELECT * FROM chats WHERE whatsapp_id = ?');
    stmt.bind([whatsappId]);

    let result: ChatRecord | undefined;
    if (stmt.step()) {
      result = stmt.getAsObject() as unknown as ChatRecord;
    }

    stmt.free();
    return result;
  }

  /**
   * 🔥 修复：全文搜索聊天 - 支持中文搜索
   * 使用LIKE搜索(sql.js默认不包含FTS5支持)
   */
  searchChats(query: string, limit: number = 50): ChatRecord[] {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // 清理和转义用户输入
    const sanitizedQuery = query
      .trim()
      .replace(/[^\w\s\u4e00-\u9fa5]/g, '') // 只保留字母、数字、空格和中文
      .toLowerCase();

    if (!sanitizedQuery) {
      return [];
    }

    // 使用LIKE进行模糊搜索(sql.js compatible)
    const fallbackQuery = `
      SELECT * FROM chats
      WHERE name LIKE ? OR last_message LIKE ?
      ORDER BY last_message_time DESC
      LIMIT ?
    `;

    const likePattern = `%${sanitizedQuery}%`;
    const stmt = this.db.prepare(fallbackQuery);
    stmt.bind([likePattern, likePattern, limit]);

    const results: ChatRecord[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as ChatRecord);
    }

    stmt.free();
    return results;
  }

  /**
   * 更新聊天置顶状态
   */
  updateChatPinned(whatsappId: string, isPinned: boolean): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    this.db.run(
      'UPDATE chats SET is_pinned = ?, updated_at = ? WHERE whatsapp_id = ?',
      [isPinned ? 1 : 0, Date.now(), whatsappId],
    );

    // 保存到磁盘
    this.saveToDisk();
  }

  /**
   * 更新聊天归档状态
   */
  updateChatArchived(whatsappId: string, isArchived: boolean): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    this.db.run(
      'UPDATE chats SET is_archived = ?, updated_at = ? WHERE whatsapp_id = ?',
      [isArchived ? 1 : 0, Date.now(), whatsappId],
    );

    // 保存到磁盘
    this.saveToDisk();
  }

  /**
   * 插入或更新消息记录（UPSERT）
   */
  upsertMessage(message: MessageRecord): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    this.db.run(
      `
      INSERT INTO messages (
        id, chat_id, sender_id, sender_name, sender_avatar,
        content, timestamp, status, type,
        is_group_chat, is_own, metadata, quoted_message,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?
      )
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        content = excluded.content,
        metadata = excluded.metadata,
        updated_at = excluded.updated_at
    `,
      [
        message.id,
        message.chat_id,
        message.sender_id,
        message.sender_name,
        message.sender_avatar,
        message.content,
        message.timestamp,
        message.status,
        message.type,
        message.is_group_chat,
        message.is_own,
        message.metadata,
        message.quoted_message,
        message.created_at,
        message.updated_at,
      ],
    );

    // 保存到磁盘
    this.saveToDisk();
  }

  /**
   * 批量插入或更新消息记录
   */
  upsertMessages(messages: MessageRecord[]): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    messages.forEach(message => {
      this.upsertMessage(message);
    });
  }

  /**
   * 根据聊天ID获取消息列表（分页）
   */
  getMessagesByChatId(
    chatId: string,
    limit: number = 50,
    offset: number = 0,
  ): MessageRecord[] {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare(`
      SELECT * FROM messages
      WHERE chat_id = ?
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `);

    stmt.bind([chatId, limit, offset]);

    const results: MessageRecord[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as MessageRecord);
    }

    stmt.free();
    return results;
  }

  /**
   * 获取指定时间戳之前的消息（用于历史消息分页）
   */
  getMessagesBeforeTimestamp(
    chatId: string,
    beforeTimestamp: number,
    limit: number = 50,
  ): MessageRecord[] {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare(`
      SELECT * FROM messages
      WHERE chat_id = ? AND timestamp < ?
      ORDER BY timestamp DESC
      LIMIT ?
    `);

    stmt.bind([chatId, beforeTimestamp, limit]);

    const results: MessageRecord[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as MessageRecord);
    }

    stmt.free();
    return results;
  }

  /**
   * 根据消息ID获取消息
   */
  getMessageById(messageId: string): MessageRecord | undefined {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare('SELECT * FROM messages WHERE id = ?');
    stmt.bind([messageId]);

    let result: MessageRecord | undefined;
    if (stmt.step()) {
      result = stmt.getAsObject() as unknown as MessageRecord;
    }

    stmt.free();
    return result;
  }

  /**
   * 更新消息状态
   */
  updateMessageStatus(messageId: string, status: string): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    this.db.run(
      'UPDATE messages SET status = ?, updated_at = ? WHERE id = ?',
      [status, Date.now(), messageId],
    );

    // 保存到磁盘
    this.saveToDisk();
  }

  /**
   * 批量更新消息状态（标记已读）
   */
  updateMessagesStatus(messageIds: string[], status: string): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const now = Date.now();
    messageIds.forEach(id => {
      this.db!.run(
        'UPDATE messages SET status = ?, updated_at = ? WHERE id = ?',
        [status, now, id],
      );
    });

    // 保存到磁盘
    this.saveToDisk();
  }

  /**
   * 获取聊天的未读消息数量
   */
  getUnreadMessageCount(chatId: string): number {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM messages
      WHERE chat_id = ? AND status != 'read' AND is_own = 0
    `);

    stmt.bind([chatId]);

    let count = 0;
    if (stmt.step()) {
      const result = stmt.getAsObject();
      count = (result.count as number) || 0;
    }

    stmt.free();
    return count;
  }

  /**
   * 搜索消息内容（使用LIKE fallback）
   */
  searchMessages(query: string, chatId?: string, limit: number = 50): MessageRecord[] {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // 清理和转义用户输入
    const sanitizedQuery = query
      .trim()
      .replace(/[^\w\s\u4e00-\u9fa5]/g, '') // 只保留字母、数字、空格和中文
      .toLowerCase();

    if (!sanitizedQuery) {
      return [];
    }

    const likePattern = `%${sanitizedQuery}%`;

    let sql = `
      SELECT * FROM messages
      WHERE content LIKE ?
    `;
    const params: (string | number)[] = [likePattern];

    if (chatId) {
      sql += ' AND chat_id = ?';
      params.push(chatId);
    }

    sql += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);

    const stmt = this.db.prepare(sql);
    stmt.bind(params);

    const results: MessageRecord[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as MessageRecord);
    }

    stmt.free();
    return results;
  }

  /**
   * 删除消息
   */
  deleteMessage(messageId: string): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    this.db.run('DELETE FROM messages WHERE id = ?', [messageId]);
    this.saveToDisk();
  }

  /**
   * 保存失败消息到队列
   */
  saveFailedMessage(messageId: string, chatId: string, content: string, errorMessage: string): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const now = Date.now();
    const id = `failed_${now}_${Math.random().toString(36).substring(2, 9)}`;

    this.db.run(
      `
      INSERT INTO failed_messages (
        id, message_id, chat_id, content,
        retry_count, max_retries, last_retry_time, error_message, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [id, messageId, chatId, content, 0, 3, null, errorMessage, now],
    );

    this.saveToDisk();
  }

  /**
   * 获取失败消息队列
   */
  getFailedMessages(chatId?: string): Array<{
    id: string;
    message_id: string;
    chat_id: string;
    content: string;
    retry_count: number;
    max_retries: number;
    last_retry_time: number | null;
    error_message: string | null;
    created_at: number;
  }> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const sql = chatId
      ? 'SELECT * FROM failed_messages WHERE chat_id = ? ORDER BY created_at DESC'
      : 'SELECT * FROM failed_messages ORDER BY created_at DESC';

    const stmt = this.db.prepare(sql);
    if (chatId) {
      stmt.bind([chatId]);
    }

    const results: any[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }

    stmt.free();
    return results;
  }

  /**
   * 移除失败消息队列中的消息
   */
  removeFailedMessage(messageId: string): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    this.db.run('DELETE FROM failed_messages WHERE message_id = ?', [messageId]);
    this.saveToDisk();
  }

  /**
   * 更新失败消息的重试计数
   */
  updateFailedMessageRetryCount(messageId: string, retryCount: number): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const now = Date.now();
    this.db.run(
      'UPDATE failed_messages SET retry_count = ?, last_retry_time = ? WHERE message_id = ?',
      [retryCount, now, messageId],
    );

    this.saveToDisk();
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('[Database] Database connection closed');
    }
  }
}

// 导出单例
export const databaseService = new DatabaseService();
