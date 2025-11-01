import { format } from 'date-fns';

import './MessageBubble.css';
import { MessageStatus } from '../../../../shared/types/chat.types';
import type { Message } from '../../../../shared/types/message.types';
import { formatMessageTime } from '../../../shared/utils/time-format';
import { Avatar } from '../../atoms/Avatar/Avatar';
import { MessageStatus as MessageStatusComponent } from '../MessageStatus';

export interface MessageBubbleProps {
  /** 消息对象 */
  message: Message;
  /** 是否是自己发送的消息 */
  isOwn: boolean;
  /** 是否显示发送者信息（群聊场景） */
  showSenderInfo?: boolean;
  /** 头像点击回调 */
  onAvatarClick?: (senderId: string) => void;
  /** 重试失败消息回调 */
  onRetry?: () => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * MessageBubble组件 - 消息气泡分子组件
 * 显示单条消息的内容、时间戳、状态等信息
 */
export const MessageBubble = ({
  message,
  isOwn,
  showSenderInfo = false,
  onAvatarClick,
  onRetry,
  className = '',
}: MessageBubbleProps): JSX.Element => {
  const classNames = [
    'message-bubble',
    isOwn ? 'message-bubble-own' : 'message-bubble-other',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const handleAvatarClick = () => {
    if (onAvatarClick && !isOwn) {
      onAvatarClick(message.senderId);
    }
  };

  // 格式化时间用于显示
  const formattedTime = formatMessageTime(message.timestamp);

  // 完整时间戳用于悬停提示
  const fullTimestamp = format(new Date(message.timestamp), 'yyyy/MM/dd HH:mm:ss');

  return (
    <div className={classNames}>
      {/* 发送者头像（仅群聊且非自己的消息） */}
      {showSenderInfo && !isOwn && (
        <button
          type="button"
          className="message-bubble-avatar"
          onClick={handleAvatarClick}
          aria-label={`View ${message.senderName}'s profile`}
        >
          <Avatar
            src={message.senderAvatar}
            name={message.senderName}
            size="sm"
            alt={message.senderName}
          />
        </button>
      )}

      <div className="message-bubble-content-wrapper">
        {/* 发送者名称（仅群聊且非自己的消息） */}
        {showSenderInfo && !isOwn && (
          <div className="message-bubble-sender-name">{message.senderName}</div>
        )}

        {/* 消息气泡 */}
        <div className="message-bubble-body">
          {/* 消息内容 */}
          <div className="message-bubble-text">{message.content}</div>

          {/* 时间和状态 */}
          <div className="message-bubble-meta">
            <span className="message-bubble-time" title={fullTimestamp}>
              {formattedTime}
            </span>
            {/* 仅自己发送的消息显示状态 */}
            {isOwn && <MessageStatusComponent status={message.status} />}
          </div>
        </div>

        {/* 失败消息重试按钮 */}
        {isOwn && message.status === MessageStatus.FAILED && onRetry && (
          <div className="message-bubble-retry">
            <button
              className="message-bubble-retry-button"
              onClick={onRetry}
              aria-label="重试发送消息"
            >
              重试
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
