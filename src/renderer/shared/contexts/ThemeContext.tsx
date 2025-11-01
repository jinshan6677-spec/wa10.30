import type {
  ReactNode} from 'react';
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from 'react';

import type { ThemeMode, ThemeContextType } from '../types/theme.types';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'whatsapp-theme';

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * 主题Provider组件
 * 管理应用的主题状态，支持light、dark和auto（跟随系统）模式
 */
export const ThemeProvider = ({ children }: ThemeProviderProps): JSX.Element => {
  // 从localStorage读取保存的主题，默认为'light'
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'auto') {
        return saved;
      }
    } catch (error) {
      console.error('Failed to load theme from localStorage:', error);
    }
    return 'light';
  });

  // 监听系统主题变化
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return 'light';
  });

  // 计算实际应用的主题
  const resolvedTheme: 'light' | 'dark' = useMemo(() => {
    if (theme === 'auto') {
      return systemTheme;
    }
    return theme;
  }, [theme, systemTheme]);

  // 监听系统主题变化
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    // 初始设置
    handleChange(mediaQuery);

    // 监听变化
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // 兼容旧版浏览器
    if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }

    return undefined;
  }, []);

  // 应用主题到DOM
  useEffect(() => {
    const root = document.documentElement;

    // 移除旧的主题class
    root.removeAttribute('data-theme');

    // 添加新的主题
    root.setAttribute('data-theme', resolvedTheme);

    // 也可以添加class供CSS使用
    root.classList.remove('theme-light', 'theme-dark');
    root.classList.add(`theme-${resolvedTheme}`);
  }, [resolvedTheme]);

  // 设置主题并保存到localStorage
  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Failed to save theme to localStorage:', error);
    }
  };

  // 切换主题 (light <-> dark)
  const toggleTheme = () => {
    const newTheme = resolvedTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
    }),
    [theme, resolvedTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

/**
 * 使用主题的Hook
 * @returns ThemeContextType
 * @throws 如果在ThemeProvider外部使用会抛出错误
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
