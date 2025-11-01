import type { KeyboardEvent, ChangeEvent } from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';

import { Button } from '../../atoms/Button';
import { Icon } from '../../atoms/Icon';
import './InputArea.css';

/** 最大消息长度（字符数） */
const MAX_MESSAGE_LENGTH = 10000;

export interface InputAreaProps {
  /** 发送消息回调 */
  onSend?: (message: string) => void;
  /** 输入状态变化回调 */
  onTyping?: (isTyping: boolean) => void;
  /** 占位符文本 */
  placeholder?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义类名 */
  className?: string;
  /** Enter键行为: 'send'=发送消息, 'newline'=换行 (默认'send') */
  enterKeyBehavior?: 'send' | 'newline';
}

/**
 * InputArea组件 - 消息输入区域分子组件
 * 提供消息输入和发送功能
 * 支持自动调整高度(最多5行)
 */
export const InputArea = ({
  onSend,
  onTyping,
  placeholder = 'Type a message',
  disabled = false,
  className = '',
  enterKeyBehavior = 'send',
}: InputAreaProps): JSX.Element => {
  const [message, setMessage] = useState('');
  const [showLengthWarning, setShowLengthWarning] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef<boolean>(false);
  const MAX_ROWS = 5; // 最多显示5行

  // 通知typing状态变化
  const notifyTypingStatus = useCallback((isTyping: boolean) => {
    if (onTyping && isTypingRef.current !== isTyping) {
      isTypingRef.current = isTyping;
      onTyping(isTyping);
    }
  }, [onTyping]);

  // 自动调整textarea高度
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) {return;}

    // 重置高度以获取正确的scrollHeight
    textarea.style.height = 'auto';

    // 计算单行高度
    const computedStyle = window.getComputedStyle(textarea);
    const lineHeight = parseInt(computedStyle.lineHeight, 10);
    const paddingTop = parseInt(computedStyle.paddingTop, 10);
    const paddingBottom = parseInt(computedStyle.paddingBottom, 10);

    // 计算最大高度(5行)
    const maxHeight = lineHeight * MAX_ROWS + paddingTop + paddingBottom;

    // 设置新高度,但不超过最大高度
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;

    // 如果内容超过最大高度,显示滚动条
    if (textarea.scrollHeight > maxHeight) {
      textarea.style.overflowY = 'auto';
    } else {
      textarea.style.overflowY = 'hidden';
    }
  };

  // 当message变化时调整高度
  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend?.(message.trim());
      setMessage('');

      // 停止typing状态
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      notifyTypingStatus(false);

      // 发送后重置高度
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.overflowY = 'hidden';
        }
      }, 0);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;

    // 检查消息长度
    if (newValue.length > MAX_MESSAGE_LENGTH) {
      // 截断到最大长度
      setMessage(newValue.substring(0, MAX_MESSAGE_LENGTH));
      setShowLengthWarning(true);
      // 3秒后隐藏警告
      setTimeout(() => setShowLengthWarning(false), 3000);
      return;
    }

    setMessage(newValue);
    setShowLengthWarning(false);

    // Typing indicator logic
    if (onTyping && !disabled) {
      // 清除之前的定时器
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // 如果有内容，发送"正在输入"状态
      if (newValue.trim()) {
        // 只在首次输入时发送typing=true
        if (!isTypingRef.current) {
          notifyTypingStatus(true);
        }

        // 设置3秒后停止typing状态
        typingTimeoutRef.current = setTimeout(() => {
          notifyTypingStatus(false);
        }, 3000);
      } else {
        // 内容为空，立即停止typing状态
        notifyTypingStatus(false);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (enterKeyBehavior === 'send') {
        // Send模式: Enter发送, Shift+Enter换行
        if (!e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
        // Shift+Enter: 允许默认行为(换行)
      } else if (e.shiftKey) {
        // Newline模式: Enter换行, Shift+Enter发送
        e.preventDefault();
        handleSend();
        // Enter: 允许默认行为(换行)
      }
    }
  };

  // 组件卸载时清除定时器和停止typing状态
  useEffect(() => () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    // 组件卸载时通知停止typing
    if (isTypingRef.current && onTyping) {
      onTyping(false);
    }
  }, [onTyping]);

  const classNames = ['input-area', className].filter(Boolean).join(' ');
  const isNearLimit = message.length > MAX_MESSAGE_LENGTH * 0.9; // 90%以上显示计数
  const characterCount = message.length;

  return (
    <div className={classNames}>
      <div className="input-area-actions-left">
        <Button variant="icon" aria-label="Attach file" disabled={disabled}>
          <Icon name="attach" />
        </Button>
      </div>
      <div className="input-area-content">
        <textarea
          ref={textareaRef}
          className="input-area-field"
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          aria-label="Message input"
          style={{ resize: 'none', overflowY: 'hidden' }}
        />
        {(isNearLimit || showLengthWarning) && (
          <div className={`input-area-character-count ${showLengthWarning ? 'warning' : ''}`}>
            {characterCount}/{MAX_MESSAGE_LENGTH}
            {showLengthWarning && ' (已达到最大长度)'}
          </div>
        )}
      </div>
      <div className="input-area-actions-right">
        {message.trim() ? (
          <Button
            variant="icon"
            aria-label="Send message"
            onClick={handleSend}
            disabled={disabled}
          >
            <Icon name="send" />
          </Button>
        ) : (
          <Button variant="icon" aria-label="Voice message" disabled={disabled}>
            <Icon name="mic" />
          </Button>
        )}
      </div>
    </div>
  );
};
