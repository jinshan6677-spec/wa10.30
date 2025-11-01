/**
 * 主题系统类型定义
 */

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ThemeContextType {
  /** 当前主题模式 */
  theme: ThemeMode;
  /** 实际应用的主题 (auto模式会解析为light或dark) */
  resolvedTheme: 'light' | 'dark';
  /** 设置主题 */
  setTheme: (theme: ThemeMode) => void;
  /** 切换主题 (light <-> dark) */
  toggleTheme: () => void;
}
