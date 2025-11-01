import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';

import './ConversationWindow.css';
import { useUserSettings } from '../../../contexts/UserSettingsContext';
import { useConnectionState } from '../../../features/whatsapp/contexts/ConnectionStateContext';
import { useMessage } from '../../../features/whatsapp/contexts/MessageContext';
import { InputArea } from '../../molecules/InputArea';
import { MessageBubble } from '../../molecules/MessageBubble';

export interface ConversationWindowProps {
  /** 聊天ID */
  chatId: string;
  /** 是否是群聊 */
  isGroupChat?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * ConversationWindow组件 - 对话窗口有机体组件
 * 显示消息列表，支持虚拟滚动和自动滚动
 */
export const ConversationWindow = ({
  chatId,
  isGroupChat = false,
  className = '',
}: ConversationWindowProps): JSX.Element => {
  const { messages, loadMessages, subscribeToMessages, setActiveChat, unreadCounts, markChatAsRead, sendMessage, retryFailedMessage, sending, sendTypingStatus } = useMessage();
  const { connectionState } = useConnectionState();
  const { settings } = useUserSettings();
  const listRef = useRef<List>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showNewMessageButton, setShowNewMessageButton] = useState(false);
  const previousMessageCountRef = useRef(0);

  const chatMessages = messages.get(chatId) ?? [];
  const unreadCount = unreadCounts.get(chatId) ?? 0;

  // 加载消息并订阅（只在 chatId 变化时执行）
  useEffect(() => {
    setActiveChat(chatId);
    void loadMessages(chatId);
    void subscribeToMessages(chatId);
  }, [chatId, loadMessages, subscribeToMessages, setActiveChat]);

  // 单独处理标记已读，避免触发订阅重新执行
  useEffect(() => {
    if (unreadCount > 0) {
      void markChatAsRead(chatId);
    }
  }, [unreadCount, chatId, markChatAsRead]);

  // 自动滚动到底部逻辑
  useEffect(() => {
    const messageCountChanged = chatMessages.length !== previousMessageCountRef.current;
    const hasNewMessages = chatMessages.length > previousMessageCountRef.current;

    if (messageCountChanged) {
      if (isAtBottom || previousMessageCountRef.current === 0) {
        // 用户在底部或首次加载，自动滚动
        if (listRef.current && chatMessages.length > 0) {
          listRef.current.scrollToItem(chatMessages.length - 1, 'end');
        }
        setShowNewMessageButton(false);
      } else if (hasNewMessages) {
        // 用户不在底部且有新消息，显示"新消息"按钮
        setShowNewMessageButton(true);
      }

      previousMessageCountRef.current = chatMessages.length;
    }
  }, [chatMessages.length, isAtBottom]);

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    if (listRef.current && chatMessages.length > 0) {
      listRef.current.scrollToItem(chatMessages.length - 1, 'end');
      setShowNewMessageButton(false);
      setIsAtBottom(true);
    }
  }, [chatMessages.length]);

  // 处理滚动事件
  const handleScroll = useCallback(({ scrollOffset, scrollUpdateWasRequested }: any) => {
    if (!scrollUpdateWasRequested && containerRef.current) {
      const { clientHeight } = containerRef.current;
      const scrollHeight = chatMessages.length * 80; // itemSize
      const scrollBottom = scrollHeight - (scrollOffset + clientHeight);

      // 距离底部小于100px认为在底部
      const atBottom = scrollBottom < 100;
      setIsAtBottom(atBottom);

      if (atBottom) {
        setShowNewMessageButton(false);
      }
    }
  }, [chatMessages.length]);

  const classNames = ['conversation-window', className].filter(Boolean).join(' ');

  // 处理消息发送
  const handleSendMessage = async (text: string) => {
    const instanceId = connectionState.instanceKey;
    if (!instanceId) {
      console.error('[ConversationWindow] Cannot send message: not connected');
      return;
    }

    try {
      await sendMessage(chatId, text, instanceId);
      // 发送成功后自动滚动到底部
      scrollToBottom();
    } catch (error) {
      console.error('[ConversationWindow] Failed to send message:', error);
    }
  };

  // 处理重试失败消息
  const handleRetryMessage = async (messageId: string) => {
    try {
      await retryFailedMessage(messageId);
    } catch (error) {
      console.error('[ConversationWindow] Failed to retry message:', error);
    }
  };

  // 处理typing状态
  const handleTyping = (isTyping: boolean) => {
    const instanceId = connectionState.instanceKey;
    if (instanceId) {
      void sendTypingStatus(chatId, isTyping, instanceId);
    }
  };

  // 消息行渲染函数
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const message = chatMessages[index];
    if (!message) {return null;}

    return (
      <div style={style}>
        <MessageBubble
          message={message}
          isOwn={message.isOwn}
          showSenderInfo={isGroupChat && !message.isOwn}
          onRetry={() => {
            void handleRetryMessage(message.id);
          }}
        />
      </div>
    );
  };

  if (chatMessages.length === 0) {
    return (
      <div className={`${classNames} conversation-window-empty`}>
        <div className="conversation-window-empty-message">还没有消息</div>
        <InputArea
          onSend={handleSendMessage}
          onTyping={handleTyping}
          placeholder="输入消息"
          disabled={!connectionState.instanceKey || sending}
          enterKeyBehavior={settings.enterKeyBehavior}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={classNames}>
      <List
        ref={listRef}
        height={containerRef.current?.clientHeight ?? 600}
        itemCount={chatMessages.length}
        itemSize={80}
        width="100%"
        onScroll={handleScroll}
      >
        {Row}
      </List>

      {/* "新消息"浮动按钮 */}
      {showNewMessageButton && (
        <button
          className="conversation-window-new-messages-button"
          onClick={scrollToBottom}
          aria-label="滚动到最新消息"
        >
          <span>新消息</span>
          {unreadCount > 0 && (
            <span className="conversation-window-new-messages-badge">{unreadCount}</span>
          )}
        </button>
      )}

      {/* 消息输入区域 */}
      <InputArea
        onSend={handleSendMessage}
        onTyping={handleTyping}
        placeholder="输入消息"
        disabled={!connectionState.instanceKey || sending}
        enterKeyBehavior={settings.enterKeyBehavior}
      />
    </div>
  );
};
