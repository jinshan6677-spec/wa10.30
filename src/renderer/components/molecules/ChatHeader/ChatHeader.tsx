import type { OnlineStatus } from '../../atoms/Avatar';
import { Avatar } from '../../atoms/Avatar';
import { Button } from '../../atoms/Button';
import { Icon } from '../../atoms/Icon';
import { Typography } from '../../atoms/Typography';
import './ChatHeader.css';

export interface ChatHeaderProps {
  /** 联系人姓名 */
  name: string;
  /** 头像URL */
  avatarSrc?: string;
  /** 在线状态 */
  status?: OnlineStatus;
  /** 状态文本 (如"在线"、"输入中...") */
  statusText?: string;
  /** 是否正在输入 */
  isTyping?: boolean;
  /** 输入者姓名（群聊使用） */
  typingContactName?: string;
  /** 自定义类名 */
  className?: string;
}

/**
 * ChatHeader组件 - 聊天头部分子组件
 * 显示聊天对象信息和操作按钮
 */
export const ChatHeader = ({
  name,
  avatarSrc,
  status,
  statusText,
  isTyping = false,
  typingContactName,
  className = '',
}: ChatHeaderProps): JSX.Element => {
  const classNames = ['chat-header', className].filter(Boolean).join(' ');

  // 确定要显示的状态文本
  const displayStatusText = (() => {
    if (isTyping) {
      // 群聊显示"[联系人名]正在输入..."，单聊显示"正在输入..."
      const typingText = typingContactName
        ? `${typingContactName}正在输入`
        : '正在输入';
      return (
        <span className="chat-header-typing">
          {typingText}
          <span className="chat-header-typing-dot" />
          <span className="chat-header-typing-dot" />
          <span className="chat-header-typing-dot" />
        </span>
      );
    }
    return statusText;
  })();

  return (
    <div className={classNames}>
      <div className="chat-header-info">
        <Avatar
          src={avatarSrc}
          name={name}
          size="md"
          status={status}
          showStatus={!!status}
        />
        <div className="chat-header-text">
          <Typography variant="body" weight="medium" color="primary">
            {name}
          </Typography>
          {displayStatusText && (
            <Typography variant="caption" color="secondary">
              {displayStatusText}
            </Typography>
          )}
        </div>
      </div>
      <div className="chat-header-actions">
        <Button variant="icon" aria-label="Search in conversation">
          <Icon name="search" />
        </Button>
        <Button variant="icon" aria-label="More options">
          <Icon name="more" />
        </Button>
      </div>
    </div>
  );
};
