import { useState, useCallback, useEffect, useRef } from 'react';

import type { Chat } from '../../../../shared/types/chat.types';

/**
 * 搜索配置选项
 */
export interface SearchOptions {
  /** 防抖延迟（毫秒） */
  debounceMs?: number;
  /** 最大结果数量 */
  maxResults?: number;
  /** 是否启用搜索历史 */
  enableHistory?: boolean;
  /** 最大历史记录数 */
  maxHistoryItems?: number;
}

/**
 * 搜索结果
 */
export interface SearchResult {
  chats: Chat[];
  query: string;
  loading: boolean;
  error: string | null;
}

/**
 * useSearch Hook
 * 提供聊天搜索功能，包括防抖、历史记录和高亮
 */
export function useSearch(options: SearchOptions = {}) {
  const {
    debounceMs = 300,
    maxResults = 50,
    enableHistory = true,
    maxHistoryItems = 10,
  } = options;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Chat[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 加载搜索历史（从localStorage）
   */
  useEffect(() => {
    if (enableHistory) {
      try {
        const savedHistory = localStorage.getItem('chat-search-history');
        if (savedHistory) {
          setSearchHistory(JSON.parse(savedHistory));
        }
      } catch (err) {
        console.error('[useSearch] Failed to load search history:', err);
      }
    }
  }, [enableHistory]);

  /**
   * 保存搜索历史（到localStorage）
   */
  const saveSearchHistory = useCallback(
    (history: string[]) => {
      if (enableHistory) {
        try {
          localStorage.setItem('chat-search-history', JSON.stringify(history));
        } catch (err) {
          console.error('[useSearch] Failed to save search history:', err);
        }
      }
    },
    [enableHistory],
  );

  /**
   * 执行搜索
   */
  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await window.electronAPI.chatAPI.searchChats(query, maxResults);

        if (response.success && response.data) {
          setSearchResults(response.data);

          // 添加到搜索历史
          if (enableHistory) {
            setSearchHistory(prev => {
              const newHistory = [query, ...prev.filter(item => item !== query)].slice(
                0,
                maxHistoryItems,
              );
              saveSearchHistory(newHistory);
              return newHistory;
            });
          }
        } else {
          setError(response.error ?? 'Search failed');
          setSearchResults([]);
        }
      } catch (err) {
        console.error('[useSearch] Search error:', err);
        setError((err as Error).message);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    },
    [maxResults, enableHistory, maxHistoryItems, saveSearchHistory],
  );

  /**
   * 处理搜索查询（带防抖）
   */
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);

      // 清除之前的定时器
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // 如果查询为空，立即清空结果
      if (!query.trim()) {
        setSearchResults([]);
        setLoading(false);
        return;
      }

      // 设置新的防抖定时器
      setLoading(true);
      debounceTimerRef.current = setTimeout(() => {
        void performSearch(query);
      }, debounceMs);
    },
    [debounceMs, performSearch],
  );

  /**
   * 清空搜索
   */
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
    setLoading(false);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  /**
   * 清空搜索历史
   */
  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
    saveSearchHistory([]);
  }, [saveSearchHistory]);

  /**
   * 从历史记录中删除一项
   */
  const removeFromHistory = useCallback(
    (query: string) => {
      setSearchHistory(prev => {
        const newHistory = prev.filter(item => item !== query);
        saveSearchHistory(newHistory);
        return newHistory;
      });
    },
    [saveSearchHistory],
  );

  /**
   * 清理定时器
   */
  useEffect(() => () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  return {
    // 状态
    searchQuery,
    searchResults,
    loading,
    error,
    searchHistory,

    // 操作
    handleSearch,
    clearSearch,
    clearSearchHistory,
    removeFromHistory,
  };
}
