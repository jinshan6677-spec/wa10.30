import React from 'react';
import { FixedSizeList as List } from 'react-window';

import type { OnlineStatus } from '../../atoms/Avatar';
import { ContactItem } from '../../molecules/ContactItem';
import './ChatList.css';

export interface ChatItemData {
  id: string;
  name: string;
  lastMessage?: string;
  lastMessageTime?: string;
  avatarSrc?: string;
  status?: OnlineStatus;
  unreadCount?: number;
  isPinned?: boolean;
}

export interface ChatListProps {
  /** 聊天列表数据 */
  chats: ChatItemData[];
  /** 当前选中的聊天ID */
  activeChatID?: string;
  /** 选择聊天回调 */
  onSelectChat?: (chatId: string) => void;
  /** 右键菜单回调 */
  onContextMenu?: (chatId: string, event: React.MouseEvent) => void;
  /** 容器高度 */
  height?: number;
  /** 自定义类名 */
  className?: string;
}

/**
 * ChatList组件 - 聊天列表有机体组件
 * 使用虚拟滚动优化大量聊天列表的渲染性能
 */
export const ChatList = ({
  chats,
  activeChatID,
  onSelectChat,
  onContextMenu,
  height = 600,
  className = '',
}: ChatListProps): JSX.Element => {
  const classNames = ['chat-list', className].filter(Boolean).join(' ');

  // 渲染单个聊天项
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const chat = chats[index];
    return (
      <div style={style}>
        <ContactItem
          name={chat.name}
          lastMessage={chat.lastMessage}
          lastMessageTime={chat.lastMessageTime}
          avatarSrc={chat.avatarSrc}
          status={chat.status}
          unreadCount={chat.unreadCount}
          isPinned={chat.isPinned}
          active={chat.id === activeChatID}
          onClick={() => onSelectChat?.(chat.id)}
          onContextMenu={(event) => {
            event.preventDefault();
            onContextMenu?.(chat.id, event);
          }}
        />
      </div>
    );
  };

  if (chats.length === 0) {
    return (
      <div className={classNames}>
        <div className="chat-list-empty">
          <p>No chats available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={classNames}>
      <List
        height={height}
        itemCount={chats.length}
        itemSize={72}
        width="100%"
      >
        {Row}
      </List>
    </div>
  );
};
