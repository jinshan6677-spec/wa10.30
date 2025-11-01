import { useEffect, useMemo, useState, useCallback } from 'react';

import type { ChatItemData } from '../../../components/organisms/ChatList';
import { ChatList } from '../../../components/organisms/ChatList';
import { formatMessageTime } from '../../../shared/utils/time-format';
import { useChatContext } from '../contexts/ChatContext';
import { useConnectionState } from '../contexts/ConnectionStateContext';

import { ChatContextMenu } from './ChatContextMenu';

interface ContextMenuState {
  chatId: string;
  x: number;
  y: number;
  isPinned: boolean;
  isArchived: boolean;
}

export interface ChatListContainerProps {
  /** 容器高度 */
  height?: number;
  /** 自定义类名 */
  className?: string;
  /** 搜索查询字符串 */
  searchQuery?: string;
}

/**
 * ChatListContainer - 聊天列表容器组件
 * 连接 ChatContext 和 ChatList 组件，处理数据转换和事件
 */
export const ChatListContainer = ({
  height = 600,
  className = '',
  searchQuery = '',
}: ChatListContainerProps): JSX.Element => {
  const {
    chats,
    loading,
    error,
    selectedChatId,
    loadChats,
    syncChats,
    selectChat,
    updateChatPinned,
    updateChatArchived,
  } = useChatContext();

  const { connectionState } = useConnectionState();
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  /**
   * 初始化：加载聊天列表
   */
  useEffect(() => {
    loadChats();
  }, [loadChats]);

  /**
   * 连接成功后自动同步聊天列表
   */
  useEffect(() => {
    if (connectionState.status === 'connected' && connectionState.instanceKey) {
      console.log('[ChatListContainer] Connected, syncing chats...');
      syncChats(connectionState.instanceKey);
    }
  }, [connectionState.status, connectionState.instanceKey, syncChats]);

  /**
   * 转换 Chat 数据为 ChatItemData 格式，并应用搜索过滤
   */
  const chatItems: ChatItemData[] = useMemo(() => {
    // 先过滤搜索
    const filteredChats = searchQuery
      ? chats.filter(chat =>
        chat.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      : chats;

    // 转换数据格式
    return filteredChats.map(chat => {
      // 转换在线状态
      let status: 'online' | 'offline' | 'away' | undefined;
      if (!chat.isGroup && chat.isOnline !== undefined) {
        status = chat.isOnline ? 'online' : 'offline';
      }

      // 格式化时间
      const lastMessageTime = chat.lastMessage.timestamp
        ? formatMessageTime(chat.lastMessage.timestamp)
        : undefined;

      return {
        id: chat.id,
        name: chat.name,
        lastMessage: chat.lastMessage.content,
        lastMessageTime,
        avatarSrc: chat.avatarUrl,
        status,
        unreadCount: chat.unreadCount,
        isPinned: chat.isPinned,
      };
    });
  }, [chats, searchQuery]);

  /**
   * 处理聊天选择
   */
  const handleSelectChat = (chatId: string) => {
    selectChat(chatId);
    // TODO: 触发加载聊天消息
    console.log('[ChatListContainer] Selected chat:', chatId);
  };

  /**
   * 处理右键菜单打开
   */
  const handleContextMenu = useCallback(
    (chatId: string, event: React.MouseEvent) => {
      const chat = chats.find(c => c.id === chatId);
      if (!chat) {return;}

      setContextMenu({
        chatId,
        x: event.clientX,
        y: event.clientY,
        isPinned: chat.isPinned,
        isArchived: chat.isArchived,
      });
    },
    [chats],
  );

  /**
   * 关闭右键菜单
   */
  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  /**
   * 处理置顶
   */
  const handlePin = useCallback(async () => {
    if (!contextMenu) {return;}
    const chat = chats.find(c => c.id === contextMenu.chatId);
    if (!chat) {return;}

    await updateChatPinned(chat.whatsappId, true);
  }, [contextMenu, chats, updateChatPinned]);

  /**
   * 处理取消置顶
   */
  const handleUnpin = useCallback(async () => {
    if (!contextMenu) {return;}
    const chat = chats.find(c => c.id === contextMenu.chatId);
    if (!chat) {return;}

    await updateChatPinned(chat.whatsappId, false);
  }, [contextMenu, chats, updateChatPinned]);

  /**
   * 处理归档
   */
  const handleArchive = useCallback(async () => {
    if (!contextMenu) {return;}
    const chat = chats.find(c => c.id === contextMenu.chatId);
    if (!chat) {return;}

    await updateChatArchived(chat.whatsappId, true);
  }, [contextMenu, chats, updateChatArchived]);

  /**
   * 处理取消归档
   */
  const handleUnarchive = useCallback(async () => {
    if (!contextMenu) {return;}
    const chat = chats.find(c => c.id === contextMenu.chatId);
    if (!chat) {return;}

    await updateChatArchived(chat.whatsappId, false);
  }, [contextMenu, chats, updateChatArchived]);

  // 错误状态
  if (error) {
    return (
      <div className={`chat-list-container ${className}`}>
        <div className="chat-list-error">
          <p>加载聊天列表失败: {error}</p>
          <button onClick={() => loadChats()} type="button">
            重试
          </button>
        </div>
      </div>
    );
  }

  // 加载状态
  if (loading && chatItems.length === 0) {
    return (
      <div className={`chat-list-container ${className}`}>
        <div className="chat-list-loading">
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  // 渲染聊天列表
  return (
    <div className={`chat-list-container ${className}`}>
      <ChatList
        chats={chatItems}
        activeChatID={selectedChatId ?? undefined}
        onSelectChat={handleSelectChat}
        onContextMenu={handleContextMenu}
        height={height}
      />
      {contextMenu && (
        <ChatContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          isPinned={contextMenu.isPinned}
          isArchived={contextMenu.isArchived}
          onPin={handlePin}
          onUnpin={handleUnpin}
          onArchive={handleArchive}
          onUnarchive={handleUnarchive}
          onClose={handleCloseContextMenu}
        />
      )}
    </div>
  );
};
