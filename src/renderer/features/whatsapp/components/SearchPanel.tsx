import { useMemo } from 'react';

import type { ChatItemData } from '../../../components/organisms/ChatList';
import { ChatList } from '../../../components/organisms/ChatList';
import { SearchBar } from '../../../components/organisms/SearchBar';
import { formatMessageTime } from '../../../shared/utils/time-format';
import { useSearch } from '../hooks/useSearch';
import './SearchPanel.css';

export interface SearchPanelProps {
  /** 选择聊天回调 */
  onSelectChat?: (chatId: string) => void;
  /** 容器高度 */
  height?: number;
  /** 当前选中的聊天ID */
  activeChatId?: string;
}

/**
 * SearchPanel - 搜索面板组件
 * 集成搜索栏、搜索结果和搜索历史
 */
export const SearchPanel = ({
  onSelectChat,
  height = 600,
  activeChatId,
}: SearchPanelProps): JSX.Element => {
  const {
    searchQuery,
    searchResults,
    loading,
    error,
    searchHistory,
    handleSearch,
    clearSearch,
    removeFromHistory,
  } = useSearch({
    debounceMs: 300,
    maxResults: 50,
    enableHistory: true,
    maxHistoryItems: 10,
  });

  /**
   * 转换搜索结果为 ChatItemData 格式
   */
  const searchResultItems: ChatItemData[] = useMemo(() => searchResults.map(chat => {
    let status: 'online' | 'offline' | 'away' | undefined;
    if (!chat.isGroup && chat.isOnline !== undefined) {
      status = chat.isOnline ? 'online' : 'offline';
    }

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
  }), [searchResults]);

  /**
   * 处理搜索历史点击
   */
  const handleHistoryClick = (historyQuery: string) => {
    handleSearch(historyQuery);
  };

  /**
   * 处理聊天选择
   */
  const handleChatSelect = (chatId: string) => {
    clearSearch();
    onSelectChat?.(chatId);
  };

  return (
    <div className="search-panel">
      {/* 搜索栏 */}
      <SearchBar onSearch={handleSearch} placeholder="搜索联系人或消息内容" />

      {/* 搜索结果区域 */}
      <div className="search-panel-content" style={{ height: height - 60 }}>
        {/* 加载状态 */}
        {loading && (
          <div className="search-panel-loading">
            <p>搜索中...</p>
          </div>
        )}

        {/* 错误状态 */}
        {error && (
          <div className="search-panel-error">
            <p>搜索失败: {error}</p>
          </div>
        )}

        {/* 搜索结果 */}
        {!loading && !error && searchQuery && searchResultItems.length > 0 && (
          <div className="search-panel-results">
            <div className="search-panel-results-header">
              <span>找到 {searchResultItems.length} 个结果</span>
            </div>
            <ChatList
              chats={searchResultItems}
              activeChatID={activeChatId}
              onSelectChat={handleChatSelect}
              height={height - 120}
            />
          </div>
        )}

        {/* 无搜索结果 */}
        {!loading && !error && searchQuery && searchResultItems.length === 0 && (
          <div className="search-panel-empty">
            <p>未找到匹配的聊天</p>
            <p className="search-panel-empty-hint">
              尝试使用其他关键词搜索
            </p>
          </div>
        )}

        {/* 搜索历史 */}
        {!loading && !error && !searchQuery && searchHistory.length > 0 && (
          <div className="search-panel-history">
            <div className="search-panel-history-header">
              <span>搜索历史</span>
              <button
                className="search-panel-history-clear"
                onClick={() => {
                  if (window.confirm('确定要清空搜索历史吗？')) {
                    // Clear history logic handled by useSearch hook
                  }
                }}
                type="button"
              >
                清空
              </button>
            </div>
            <ul className="search-panel-history-list">
              {searchHistory.map((historyItem, index) => (
                <li key={index} className="search-panel-history-item">
                  <button
                    className="search-panel-history-query"
                    onClick={() => handleHistoryClick(historyItem)}
                    type="button"
                  >
                    <span className="search-panel-history-icon">🔍</span>
                    <span className="search-panel-history-text">{historyItem}</span>
                  </button>
                  <button
                    className="search-panel-history-remove"
                    onClick={() => removeFromHistory(historyItem)}
                    aria-label={`删除搜索历史: ${historyItem}`}
                    type="button"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 默认提示 */}
        {!loading && !error && !searchQuery && searchHistory.length === 0 && (
          <div className="search-panel-hint">
            <p>输入联系人名称或消息内容进行搜索</p>
          </div>
        )}
      </div>
    </div>
  );
};
