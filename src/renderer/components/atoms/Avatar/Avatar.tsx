import React from 'react';
import './Avatar.css';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';
export type OnlineStatus = 'online' | 'away' | 'offline';

export interface AvatarProps {
  /** 头像图片URL */
  src?: string;
  /** 图片加载失败时的alt文本 */
  alt?: string;
  /** 用于生成文字头像的名字 */
  name?: string;
  /** 头像大小 */
  size?: AvatarSize;
  /** 在线状态 */
  status?: OnlineStatus;
  /** 是否显示在线状态 */
  showStatus?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * Avatar组件 - 头像原子组件
 * 支持图片头像、文字初始化头像和在线状态显示
 */
export const Avatar = ({
  src,
  alt = '',
  name = '',
  size = 'md',
  status = 'offline',
  showStatus = false,
  className = '',
}: AvatarProps): JSX.Element => {
  const [imageError, setImageError] = React.useState(false);

  // 生成文字头像的初始化字符
  const getInitials = (nameStr: string): string => {
    if (!nameStr) {return '?';}

    const words = nameStr.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const classNames = [
    'avatar',
    `avatar-${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const showImage = src && !imageError;
  const initials = getInitials(name);

  return (
    <div className={classNames} role="img" aria-label={alt || name || 'Avatar'}>
      {showImage ? (
        <img
          src={src}
          alt={alt || name}
          onError={handleImageError}
          className="avatar-image"
        />
      ) : (
        <span className="avatar-text">{initials}</span>
      )}
      {showStatus && (
        <span
          className={`avatar-status avatar-status-${status}`}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
};
