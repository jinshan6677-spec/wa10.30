import './MessageStatus.css';
import type { MessageStatus as StatusType } from '../../../../shared/types/chat.types';

export interface MessageStatusProps {
  /** 消息状态 */
  status: StatusType;
  /** 自定义类名 */
  className?: string;
}

/**
 * MessageStatus组件 - 消息状态图标组件
 * 显示消息发送状态（已发送、已送达、已读等）
 */
export const MessageStatus = ({ status, className = '' }: MessageStatusProps): JSX.Element => {
  const classNames = ['message-status', `message-status-${status}`, className]
    .filter(Boolean)
    .join(' ');

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return (
          <svg
            className="message-status-icon"
            viewBox="0 0 16 16"
            width="16"
            height="16"
            aria-label="发送中"
          >
            <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        );

      case 'sent':
        return (
          <svg
            className="message-status-icon"
            viewBox="0 0 16 16"
            width="16"
            height="16"
            aria-label="已发送"
          >
            <path
              d="M5 8 L7 10 L11 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );

      case 'delivered':
        return (
          <svg
            className="message-status-icon"
            viewBox="0 0 16 16"
            width="16"
            height="16"
            aria-label="已送达"
          >
            {/* 双勾 */}
            <path
              d="M3 8 L5 10 L9 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M6 8 L8 10 L12 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );

      case 'read':
        return (
          <svg
            className="message-status-icon message-status-icon-read"
            viewBox="0 0 16 16"
            width="16"
            height="16"
            aria-label="已读"
          >
            {/* 蓝色双勾 */}
            <path
              d="M3 8 L5 10 L9 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M6 8 L8 10 L12 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );

      case 'failed':
        return (
          <svg
            className="message-status-icon message-status-icon-failed"
            viewBox="0 0 16 16"
            width="16"
            height="16"
            aria-label="发送失败"
          >
            <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M8 4 L8 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="8" cy="11.5" r="0.5" fill="currentColor" />
          </svg>
        );

      default:
        return null;
    }
  };

  return (
    <span className={classNames} role="img" aria-label={`消息状态: ${status}`}>
      {getStatusIcon()}
    </span>
  );
};
