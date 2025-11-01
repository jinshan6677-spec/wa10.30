import { useState, useRef, useEffect } from 'react';

import { useUserSettings } from '../../../contexts/UserSettingsContext';
import { Icon } from '../../atoms/Icon';
import './SettingsMenu.css';

/**
 * SettingsMenu组件 - 用户设置菜单
 * 提供用户偏好设置选项
 */
export const SettingsMenu = (): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);
  const { settings, updateSetting } = useUserSettings();
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }

    return undefined;
  }, [isOpen]);

  const handleToggleEnterKeyBehavior = () => {
    const newBehavior = settings.enterKeyBehavior === 'send' ? 'newline' : 'send';
    updateSetting('enterKeyBehavior', newBehavior);
  };

  return (
    <div className="settings-menu" ref={menuRef}>
      <button
        className="settings-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="设置"
      >
        <Icon name="settings" />
      </button>

      {isOpen && (
        <div className="settings-menu-dropdown">
          <div className="settings-menu-header">设置</div>

          <div className="settings-menu-section">
            <div className="settings-menu-item">
              <div className="settings-menu-item-label">
                <span>Enter键行为</span>
                <span className="settings-menu-item-description">
                  {settings.enterKeyBehavior === 'send'
                    ? 'Enter发送消息，Shift+Enter换行'
                    : 'Enter换行，Shift+Enter发送消息'}
                </span>
              </div>
              <button
                className="settings-menu-toggle"
                onClick={handleToggleEnterKeyBehavior}
                aria-label={`切换Enter键行为，当前: ${settings.enterKeyBehavior === 'send' ? 'Enter发送' : 'Enter换行'}`}
              >
                <div
                  className={`settings-menu-toggle-track ${settings.enterKeyBehavior === 'send' ? 'active' : ''}`}
                >
                  <div className="settings-menu-toggle-thumb" />
                </div>
                <span className="settings-menu-toggle-label">
                  {settings.enterKeyBehavior === 'send' ? 'Enter发送' : 'Enter换行'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
