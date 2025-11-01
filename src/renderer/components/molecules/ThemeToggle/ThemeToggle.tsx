import { useTheme } from '../../../shared/contexts';
import './ThemeToggle.css';

export interface ThemeToggleProps {
  /** 自定义类名 */
  className?: string;
}

/**
 * ThemeToggle组件 - 主题切换按钮
 * 提供明亮/暗黑主题切换功能
 */
export const ThemeToggle = ({ className = '' }: ThemeToggleProps): JSX.Element => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const classNames = ['theme-toggle', className].filter(Boolean).join(' ');

  return (
    <button
      className={classNames}
      onClick={toggleTheme}
      aria-label={isDark ? '切换到明亮模式' : '切换到暗黑模式'}
      title={isDark ? '切换到明亮模式' : '切换到暗黑模式'}
      type="button"
    >
      {isDark ? (
        // 太阳图标 (明亮模式)
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="10" cy="10" r="4" fill="currentColor" />
          <line x1="10" y1="2" x2="10" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="10" y1="16" x2="10" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="2" y1="10" x2="4" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="16" y1="10" x2="18" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="4.34" y1="4.34" x2="5.76" y2="5.76" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="14.24" y1="14.24" x2="15.66" y2="15.66" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="4.34" y1="15.66" x2="5.76" y2="14.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="14.24" y1="5.76" x2="15.66" y2="4.34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ) : (
        // 月亮图标 (暗黑模式)
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 2C10.3 2 10.6 2 10.9 2.1C10.3 3.1 10 4.3 10 5.5C10 9.1 12.9 12 16.5 12C17.2 12 17.8 11.9 18.4 11.7C17.6 15.4 14.2 18 10 18C5.6 18 2 14.4 2 10C2 5.8 4.6 2.4 8.3 1.6C8.8 1.9 9.4 2 10 2Z"
            fill="currentColor"
          />
        </svg>
      )}
    </button>
  );
};
