import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';

/**
 * 用户设置接口
 */
export interface UserSettings {
  /** Enter键行为: 'send'=发送消息, 'newline'=换行 */
  enterKeyBehavior: 'send' | 'newline';
}

/**
 * 默认设置
 */
const DEFAULT_SETTINGS: UserSettings = {
  enterKeyBehavior: 'send', // 默认Enter发送
};

/**
 * UserSettings Context接口
 */
interface UserSettingsContextType {
  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
}

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

/**
 * LocalStorage key for persisting settings
 */
const STORAGE_KEY = 'userSettings';

/**
 * Load settings from localStorage
 */
const loadSettings = (): UserSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.error('Failed to load user settings:', error);
  }
  return DEFAULT_SETTINGS;
};

/**
 * Save settings to localStorage
 */
const saveSettings = (settings: UserSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save user settings:', error);
  }
};

/**
 * UserSettingsProvider组件
 * 提供用户设置状态管理和持久化
 */
export const UserSettingsProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [settings, setSettings] = useState<UserSettings>(loadSettings);

  // 持久化设置到localStorage
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const updateSetting = useCallback(<K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  return (
    <UserSettingsContext.Provider value={{ settings, updateSetting }}>
      {children}
    </UserSettingsContext.Provider>
  );
};

/**
 * useUserSettings Hook
 * 获取用户设置和更新方法
 */
export const useUserSettings = (): UserSettingsContextType => {
  const context = useContext(UserSettingsContext);
  if (!context) {
    throw new Error('useUserSettings must be used within UserSettingsProvider');
  }
  return context;
};
