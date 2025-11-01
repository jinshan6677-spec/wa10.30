import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

import type { Chat } from '../../../../shared/types/chat.types';

/**
 * ChatContext 状态接口
 */
export interface ChatContextState {
  chats: Chat[];
  loading: boolean;
  error: string | null;
  selectedChatId: string | null;
  includeArchived: boolean;
}

/**
 * ChatContext 操作接口
 */
export interface ChatContextActions {
  loadChats: (includeArchived?: boolean) => Promise<void>;
  syncChats: (instanceName: string) => Promise<void>;
  selectChat: (chatId: string) => void;
  toggleIncludeArchived: () => void;
  updateChatPinned: (whatsappId: string, isPinned: boolean) => Promise<void>;
  updateChatArchived: (whatsappId: string, isArchived: boolean) => Promise<void>;
}

/**
 * ChatContext 完整接口
 */
export interface ChatContextValue extends ChatContextState, ChatContextActions {}

/**
 * ChatContext
 */
const ChatContext = createContext<ChatContextValue | undefined>(undefined);

/**
 * ChatProvider props
 */
export interface ChatProviderProps {
  children: React.ReactNode;
}

/**
 * ChatProvider - 聊天列表状态管理提供者
 */
export const ChatProvider = ({ children }: ChatProviderProps): JSX.Element => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [includeArchived, setIncludeArchived] = useState<boolean>(false);

  /**
   * 从本地缓存加载聊天列表
   */
  const loadChats = useCallback(async (includeArchivedParam = false) => {
    setLoading(true);
    setError(null);

    try {
      const response = await window.electronAPI.chatAPI.getChats({
        includeArchived: includeArchivedParam,
      });

      if (response.success && response.data) {
        setChats(response.data.chats);
      } else {
        setError(response.error ?? 'Failed to load chats');
      }
    } catch (err) {
      console.error('[ChatContext] Failed to load chats:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 从 Evolution API 同步聊天列表
   */
  const syncChats = useCallback(async (instanceName: string) => {
    setLoading(true);
    setError(null);

    try {
      const syncResponse = await window.electronAPI.chatAPI.syncChats(instanceName);

      if (syncResponse.success) {
        // 同步成功后重新加载聊天列表
        await loadChats(includeArchived);
      } else {
        setError(syncResponse.error ?? 'Failed to sync chats');
      }
    } catch (err) {
      console.error('[ChatContext] Failed to sync chats:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [includeArchived, loadChats]);

  /**
   * 选择聊天
   */
  const selectChat = useCallback((chatId: string) => {
    setSelectedChatId(chatId);
  }, []);

  /**
   * 切换是否包含归档聊天
   */
  const toggleIncludeArchived = useCallback(() => {
    setIncludeArchived(prev => {
      const newValue = !prev;
      loadChats(newValue);
      return newValue;
    });
  }, [loadChats]);

  /**
   * 更新聊天置顶状态
   */
  const updateChatPinned = useCallback(
    async (whatsappId: string, isPinned: boolean) => {
      try {
        const response = await window.electronAPI.chatAPI.updateChat({
          whatsappId,
          isPinned,
        });

        if (response.success) {
          // 更新本地状态
          setChats(prevChats =>
            prevChats.map(chat =>
              chat.whatsappId === whatsappId ? { ...chat, isPinned } : chat,
            ),
          );
        } else {
          setError(response.error ?? 'Failed to update chat pinned status');
        }
      } catch (err) {
        console.error('[ChatContext] Failed to update chat pinned:', err);
        setError((err as Error).message);
      }
    },
    [],
  );

  /**
   * 更新聊天归档状态
   */
  const updateChatArchived = useCallback(
    async (whatsappId: string, isArchived: boolean) => {
      try {
        const response = await window.electronAPI.chatAPI.updateChat({
          whatsappId,
          isArchived,
        });

        if (response.success) {
          // 从列表中移除归档的聊天（如果不显示归档）
          if (isArchived && !includeArchived) {
            setChats(prevChats => prevChats.filter(chat => chat.whatsappId !== whatsappId));
          } else {
            // 更新本地状态
            setChats(prevChats =>
              prevChats.map(chat =>
                chat.whatsappId === whatsappId ? { ...chat, isArchived } : chat,
              ),
            );
          }
        } else {
          setError(response.error ?? 'Failed to update chat archived status');
        }
      } catch (err) {
        console.error('[ChatContext] Failed to update chat archived:', err);
        setError((err as Error).message);
      }
    },
    [includeArchived],
  );

  /**
   * 监听聊天列表更新事件
   */
  useEffect(() => {
    const handleChatListUpdated = (_event: unknown, updatedChats: Chat[]) => {
      setChats(updatedChats);
    };

    const handleChatUpdated = (_event: unknown, updatedChat: Chat) => {
      setChats(prevChats =>
        prevChats.map(chat => (chat.whatsappId === updatedChat.whatsappId ? updatedChat : chat)),
      );
    };

    window.electronAPI.on('chat:list-updated', handleChatListUpdated);
    window.electronAPI.on('chat:updated', handleChatUpdated);

    return () => {
      window.electronAPI.off('chat:list-updated', handleChatListUpdated);
      window.electronAPI.off('chat:updated', handleChatUpdated);
    };
  }, []);

  const contextValue: ChatContextValue = {
    chats,
    loading,
    error,
    selectedChatId,
    includeArchived,
    loadChats,
    syncChats,
    selectChat,
    toggleIncludeArchived,
    updateChatPinned,
    updateChatArchived,
  };

  return <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>;
};

/**
 * useChatContext hook - 访问 ChatContext
 */
export function useChatContext(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}
