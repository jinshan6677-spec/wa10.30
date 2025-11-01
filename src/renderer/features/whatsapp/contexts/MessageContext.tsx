import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

import { MessageStatus } from '../../../../shared/types/chat.types';
import type { Message, GetMessagesRequest } from '../../../../shared/types/message.types';
import { MessageType } from '../../../../shared/types/message.types';

interface TypingStatus {
  isTyping: boolean;
  contactName?: string;
}

interface MessageContextValue {
  // 消息数据 - Map<chatId, Message[]>
  messages: Map<string, Message[]>;
  // 当前活跃的聊天ID
  activeChat: string | null;
  // 未读消息计数 - Map<chatId, number>
  unreadCounts: Map<string, number>;
  // 输入状态 - Map<chatId, TypingStatus>
  typingStatus: Map<string, TypingStatus>;
  // 加载状态
  loading: boolean;
  // 错误信息
  error: string | null;
  // 发送状态
  sending: boolean;

  // 方法
  loadMessages: (chatId: string, limit?: number, offset?: number) => Promise<void>;
  subscribeToMessages: (chatId: string) => Promise<void>;
  unsubscribeFromMessages: (chatId: string) => void;
  updateMessageStatus: (messageId: string, status: string) => void;
  markChatAsRead: (chatId: string) => Promise<void>;
  setActiveChat: (chatId: string | null) => void;
  sendMessage: (chatId: string, content: string, instanceId: string) => Promise<void>;
  retryFailedMessage: (messageId: string) => Promise<void>;
  sendTypingStatus: (chatId: string, isTyping: boolean, instanceId: string) => Promise<void>;
}

const MessageContext = createContext<MessageContextValue | undefined>(undefined);

export const MessageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Map<string, Message[]>>(new Map());
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());
  const [typingStatus, setTypingStatus] = useState<Map<string, TypingStatus>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // 加载消息
  const loadMessages = useCallback(async (chatId: string, limit = 50, offset = 0) => {
    setLoading(true);
    setError(null);

    try {
      const request: GetMessagesRequest = { chatId, limit, offset };
      const response = await window.electronAPI.messageAPI.getMessages(request);

      if (response.success && response.data) {
        setMessages(prev => {
          const newMap = new Map(prev);
          const existingMessages = newMap.get(chatId) || [];

          // 合并消息（去重）
          const messageMap = new Map(existingMessages.map(m => [m.id, m]));
          response.data!.messages.forEach(m => messageMap.set(m.id, m));

          const mergedMessages = Array.from(messageMap.values())
            .sort((a, b) => a.timestamp - b.timestamp);

          newMap.set(chatId, mergedMessages);
          return newMap;
        });
      } else {
        setError(response.error || '加载消息失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  }, []);

  // 订阅实时消息
  const subscribeToMessages = useCallback(async (chatId: string) => {
    try {
      await window.electronAPI.messageAPI.subscribe(chatId);
    } catch (err) {
      console.error('Failed to subscribe to messages:', err);
    }
  }, []);

  // 取消订阅
  const unsubscribeFromMessages = useCallback((chatId: string) => {
    window.electronAPI.messageAPI.unsubscribe(chatId);
  }, []);

  // 更新消息状态
  const updateMessageStatus = useCallback((messageId: string, status: string) => {
    setMessages(prev => {
      const newMap = new Map(prev);
      newMap.forEach((msgs, chatId) => {
        const index = msgs.findIndex(m => m.id === messageId);
        if (index !== -1) {
          const updated = [...msgs];
          updated[index] = { ...updated[index], status: status as any };
          newMap.set(chatId, updated);
        }
      });
      return newMap;
    });
  }, []);

  // 标记聊天为已读
  const markChatAsRead = useCallback(async (chatId: string) => {
    const chatMessages = messages.get(chatId) || [];
    const unreadMessageIds = chatMessages
      .filter(m => m.status !== 'read' && !m.isOwn)
      .map(m => m.id);

    if (unreadMessageIds.length > 0) {
      try {
        await window.electronAPI.messageAPI.markAsRead({
          chatId,
          messageIds: unreadMessageIds,
        });

        setUnreadCounts(prev => {
          const newMap = new Map(prev);
          newMap.set(chatId, 0);
          return newMap;
        });
      } catch (err) {
        console.error('Failed to mark messages as read:', err);
      }
    }
  }, [messages]);

  // 发送消息
  const sendMessage = useCallback(async (chatId: string, content: string, instanceId: string) => {
    setSending(true);
    setError(null);

    try {
      // 创建临时消息（乐观更新）
      const tempMessage: Message = {
        id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        chatId,
        senderId: 'me',
        senderName: '我',
        content,
        timestamp: Date.now(),
        status: MessageStatus.PENDING,
        type: MessageType.TEXT,
        isGroupChat: chatId.includes('@g.us'),
        isOwn: true,
      };

      // 立即添加到消息列表（乐观更新）
      setMessages(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(chatId) || [];
        newMap.set(chatId, [...existing, tempMessage]);
        return newMap;
      });

      // 调用 IPC 发送消息
      const response = await window.electronAPI.messageAPI.sendMessage({
        chatId,
        content,
        instanceId,
      });

      if (response.success && response.data) {
        // 发送成功，替换临时消息为真实消息
        setMessages(prev => {
          const newMap = new Map(prev);
          const existing = newMap.get(chatId) || [];
          const updated = existing.map(m =>
            m.id === tempMessage.id ? response.data! : m,
          );
          newMap.set(chatId, updated);
          return newMap;
        });
      } else {
        // 发送失败，更新临时消息状态为 failed
        setMessages(prev => {
          const newMap = new Map(prev);
          const existing = newMap.get(chatId) || [];
          const updated = existing.map(m =>
            m.id === tempMessage.id ? { ...m, status: MessageStatus.FAILED } : m,
          );
          newMap.set(chatId, updated);
          return newMap;
        });
        setError(response.error || '发送消息失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setSending(false);
    }
  }, []);

  // 重试失败消息
  const retryFailedMessage = useCallback(async (messageId: string) => {
    // 找到失败的消息
    let failedMessage: Message | null = null;
    let chatId: string | null = null;

    messages.forEach((msgs, cid) => {
      const msg = msgs.find(m => m.id === messageId);
      if (msg && msg.status === MessageStatus.FAILED) {
        failedMessage = msg;
        chatId = cid;
      }
    });

    if (!failedMessage || !chatId) {
      console.error('Failed message not found:', messageId);
      return;
    }

    // 更新消息状态为 pending
    setMessages(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(chatId!) || [];
      const updated = existing.map(m =>
        m.id === messageId ? { ...m, status: MessageStatus.PENDING } : m,
      );
      newMap.set(chatId!, updated);
      return newMap;
    });

    // TODO: 调用重试 API（需要后端支持）
    // 暂时使用 sendMessage 重新发送
    // await window.electronAPI.messageAPI.retryMessage(messageId);
  }, [messages]);

  // 发送输入状态
  const sendTypingStatus = useCallback(async (chatId: string, isTyping: boolean, instanceId: string) => {
    try {
      await window.electronAPI.messageAPI.sendTypingStatus({
        chatId,
        isTyping,
        instanceId,
      });

      // 更新本地状态（用于显示自己的typing状态）
      setTypingStatus(prev => {
        const newMap = new Map(prev);
        if (isTyping) {
          newMap.set(chatId, { isTyping: true });
        } else {
          newMap.delete(chatId);
        }
        return newMap;
      });
    } catch (error) {
      console.error('[MessageContext] Failed to send typing status:', error);
      // Typing状态不是关键功能，失败不影响用户体验
    }
  }, []);

  // 监听新消息事件
  useEffect(() => {
    const handleNewMessage = (_event: any, data: { chatId: string; messages: Message[] }) => {
      console.log('[MessageContext] 📨 Received new message:', data.chatId, data.messages.length);
      setMessages(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(data.chatId) || [];
        const messageMap = new Map(existing.map(m => [m.id, m]));

        data.messages.forEach(m => messageMap.set(m.id, m));

        const updated = Array.from(messageMap.values())
          .sort((a, b) => a.timestamp - b.timestamp);

        newMap.set(data.chatId, updated);
        return newMap;
      });

      // 更新未读计数
      if (data.chatId !== activeChat) {
        setUnreadCounts(prev => {
          const newMap = new Map(prev);
          const count = newMap.get(data.chatId) || 0;
          newMap.set(data.chatId, count + data.messages.filter(m => !m.isOwn).length);
          return newMap;
        });
      }
    };

    const handleStatusUpdate = (_event: any, data: { messageId: string; status: string }) => {
      updateMessageStatus(data.messageId, data.status);
    };

    window.electronAPI.on('message:new', handleNewMessage);
    window.electronAPI.on('message:status-update', handleStatusUpdate);

    return () => {
      window.electronAPI.off('message:new', handleNewMessage);
      window.electronAPI.off('message:status-update', handleStatusUpdate);
    };
  }, [activeChat, updateMessageStatus]);

  const value: MessageContextValue = {
    messages,
    activeChat,
    unreadCounts,
    typingStatus,
    loading,
    error,
    sending,
    loadMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
    updateMessageStatus,
    markChatAsRead,
    setActiveChat,
    sendMessage,
    retryFailedMessage,
    sendTypingStatus,
  };

  return <MessageContext.Provider value={value}>{children}</MessageContext.Provider>;
};

export const useMessage = (): MessageContextValue => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessage must be used within MessageProvider');
  }
  return context;
};
