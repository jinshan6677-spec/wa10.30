import type { OnlineStatus } from '../../atoms/Avatar';
import { Avatar } from '../../atoms/Avatar';
import { Typography } from '../../atoms/Typography';
import './ContactItem.css';

export interface ContactItemProps {
  /** 联系人姓名 */
  name: string;
  /** 最后一条消息 */
  lastMessage?: string;
  /** 最后消息时间 */
  lastMessageTime?: string;
  /** 头像URL */
  avatarSrc?: string;
  /** 在线状态 */
  status?: OnlineStatus;
  /** 未读消息数 */
  unreadCount?: number;
  /** 是否已选中 */
  active?: boolean;
  /** 是否置顶 */
  isPinned?: boolean;
  /** 点击回调 */
  onClick?: () => void;
  /** 右键菜单回调 */
  onContextMenu?: (event: React.MouseEvent) => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * ContactItem组件 - 联系人列表项分子组件
 * 显示联系人信息、最后消息和未读计数
 */
export const ContactItem = ({
  name,
  lastMessage,
  lastMessageTime,
  avatarSrc,
  status,
  unreadCount = 0,
  active = false,
  isPinned = false,
  onClick,
  onContextMenu,
  className = '',
}: ContactItemProps): JSX.Element => {
  const classNames = [
    'contact-item',
    active && 'contact-item-active',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classNames}
      onClick={onClick}
      onContextMenu={onContextMenu}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      aria-label={`Chat with ${name}`}
    >
      <Avatar
        src={avatarSrc}
        name={name}
        size="md"
        status={status}
        showStatus={!!status}
      />
      <div className="contact-item-content">
        <div className="contact-item-header">
          <Typography
            variant="body"
            weight="medium"
            color="primary"
            className="contact-item-name"
            truncate
          >
            {name}
          </Typography>
          <div className="contact-item-header-right">
            {isPinned && (
              <span className="contact-item-pin-icon" aria-label="Pinned">
                📌
              </span>
            )}
            {lastMessageTime && (
              <Typography
                variant="caption"
                color="secondary"
                className="contact-item-time"
              >
                {lastMessageTime}
              </Typography>
            )}
          </div>
        </div>
        <div className="contact-item-footer">
          {lastMessage && (
            <Typography
              variant="caption"
              color="secondary"
              className="contact-item-message"
              truncate
            >
              {lastMessage}
            </Typography>
          )}
          {unreadCount > 0 && (
            <div className="contact-item-badge" aria-label={`${unreadCount} unread messages`}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
