import { useEffect, useRef } from 'react';
import './ChatContextMenu.css';

export interface ChatContextMenuProps {
  /** 菜单位置 X */
  x: number;
  /** 菜单位置 Y */
  y: number;
  /** 是否置顶 */
  isPinned: boolean;
  /** 是否归档 */
  isArchived: boolean;
  /** 置顶回调 */
  onPin?: () => void;
  /** 取消置顶回调 */
  onUnpin?: () => void;
  /** 归档回调 */
  onArchive?: () => void;
  /** 取消归档回调 */
  onUnarchive?: () => void;
  /** 关闭菜单回调 */
  onClose: () => void;
}

/**
 * ChatContextMenu - 聊天右键菜单组件
 * 提供置顶、归档等操作
 */
export const ChatContextMenu = ({
  x,
  y,
  isPinned,
  isArchived,
  onPin,
  onUnpin,
  onArchive,
  onUnarchive,
  onClose,
}: ChatContextMenuProps): JSX.Element => {
  const menuRef = useRef<HTMLDivElement>(null);

  /**
   * 点击外部关闭菜单
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // 延迟绑定事件，避免立即触发
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [onClose]);

  /**
   * 按ESC关闭菜单
   */
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  /**
   * 处理菜单项点击
   */
  const handleMenuItemClick = (action: () => void | undefined) => {
    action?.();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="chat-context-menu"
      style={{ left: x, top: y }}
      role="menu"
      aria-label="聊天操作菜单"
    >
      {/* 置顶/取消置顶 */}
      {isPinned ? (
        <button
          className="chat-context-menu-item"
          onClick={() => handleMenuItemClick(onUnpin!)}
          role="menuitem"
          type="button"
        >
          <span className="chat-context-menu-icon">📌</span>
          <span className="chat-context-menu-text">取消置顶</span>
        </button>
      ) : (
        <button
          className="chat-context-menu-item"
          onClick={() => handleMenuItemClick(onPin!)}
          role="menuitem"
          type="button"
        >
          <span className="chat-context-menu-icon">📌</span>
          <span className="chat-context-menu-text">置顶聊天</span>
        </button>
      )}

      {/* 归档/取消归档 */}
      {isArchived ? (
        <button
          className="chat-context-menu-item"
          onClick={() => handleMenuItemClick(onUnarchive!)}
          role="menuitem"
          type="button"
        >
          <span className="chat-context-menu-icon">📂</span>
          <span className="chat-context-menu-text">取消归档</span>
        </button>
      ) : (
        <button
          className="chat-context-menu-item"
          onClick={() => handleMenuItemClick(onArchive!)}
          role="menuitem"
          type="button"
        >
          <span className="chat-context-menu-icon">📦</span>
          <span className="chat-context-menu-text">归档聊天</span>
        </button>
      )}
    </div>
  );
};
