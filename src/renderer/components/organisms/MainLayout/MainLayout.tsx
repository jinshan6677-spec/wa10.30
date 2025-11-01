import { useState, useEffect } from 'react';

import { ChatListContainer } from '../../../features/whatsapp/components/ChatListContainer';
import { useChatContext } from '../../../features/whatsapp/contexts/ChatContext';
import { SettingsMenu } from '../../molecules/SettingsMenu';
import { ThemeToggle } from '../../molecules/ThemeToggle';
import { ConversationWindow } from '../ConversationWindow';
import './MainLayout.css';

export interface MainLayoutProps {
  /** 自定义类名 */
  className?: string;
}

/**
 * MainLayout组件 - 主布局有机体组件
 * 实现WhatsApp Web的三栏布局：搜索栏+聊天列表+对话窗口
 */
export const MainLayout = ({ className = '' }: MainLayoutProps): JSX.Element => {
  const { chats, selectedChatId, loadChats } = useChatContext();
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 组件挂载时加载聊天列表
  useEffect(() => {
    console.log('[MainLayout] Component mounted, loading chats...');
    void loadChats(false); // 加载非归档聊天
  }, [loadChats]);

  const selectedChat = chats.find(chat => chat.id === selectedChatId);

  const classNames = ['main-layout', className].filter(Boolean).join(' ');

  return (
    <div className={classNames}>
      <aside className="main-layout-sidebar">
        <div className="main-layout-sidebar-header">
          <h1 className="main-layout-title">WhatsApp</h1>
          <div className="main-layout-sidebar-actions">
            <SettingsMenu />
            <ThemeToggle />
          </div>
        </div>
        <div className="main-layout-search">
          <div className="main-layout-search-input-wrapper">
            <span className="main-layout-search-icon">🔍</span>
            <input
              type="text"
              className="main-layout-search-input"
              placeholder="搜索或开始新聊天"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="搜索聊天"
            />
            {searchQuery && (
              <button
                className="main-layout-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="清除搜索"
                type="button"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        <ChatListContainer
          height={window.innerHeight - 120}
          searchQuery={searchQuery}
        />
      </aside>
      <main className="main-layout-content">
        {selectedChat ? (
          <ConversationWindow
            chatId={selectedChat.whatsappId}
            isGroupChat={selectedChat.isGroup || false}
          />
        ) : (
          <div className="main-layout-empty">
            <p>选择一个聊天开始消息</p>
          </div>
        )}
      </main>
    </div>
  );
};
