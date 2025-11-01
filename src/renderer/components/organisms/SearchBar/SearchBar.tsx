import { useState, useCallback } from 'react';

import { Input } from '../../atoms/Input';
import './SearchBar.css';

export interface SearchBarProps {
  /** 搜索回调 */
  onSearch?: (query: string) => void;
  /** 占位符文本 */
  placeholder?: string;
  /** 防抖延迟（毫秒） */
  debounceDelay?: number;
  /** 自定义类名 */
  className?: string;
}

/**
 * SearchBar组件 - 搜索栏有机体组件
 * 提供搜索功能,支持防抖优化
 */
export const SearchBar = ({
  onSearch,
  placeholder = 'Search or start new chat',
  debounceDelay = 300,
  className = '',
}: SearchBarProps): JSX.Element => {
  const [query, setQuery] = useState('');
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);

      // 清除之前的计时器
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // 设置新的防抖计时器
      const timer = setTimeout(() => {
        onSearch?.(value);
      }, debounceDelay);

      setDebounceTimer(timer);
    },
    [onSearch, debounceDelay, debounceTimer],
  );

  const classNames = ['search-bar-container', className].filter(Boolean).join(' ');

  return (
    <div className={classNames}>
      <Input
        variant="search"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder={placeholder}
        fullWidth
        aria-label="Search chats"
      />
    </div>
  );
};
