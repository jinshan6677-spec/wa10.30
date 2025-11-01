import './Icon.css';

export type IconName =
  | 'search'
  | 'send'
  | 'attach'
  | 'emoji'
  | 'mic'
  | 'more'
  | 'close'
  | 'check'
  | 'check-double'
  | 'arrow-left'
  | 'menu'
  | 'settings';

export type IconSize = 'sm' | 'md' | 'lg';

export interface IconProps {
  /** 图标名称 */
  name: IconName;
  /** 图标大小 */
  size?: IconSize;
  /** 自定义类名 */
  className?: string;
  /** 无障碍标签 */
  'aria-label'?: string;
}

/**
 * Icon组件 - SVG图标原子组件
 * 封装常用的WhatsApp图标
 */
export const Icon = ({
  name,
  size = 'md',
  className = '',
  'aria-label': ariaLabel,
}: IconProps): JSX.Element => {
  const classNames = ['icon', `icon-${size}`, className].filter(Boolean).join(' ');

  const getPath = (): JSX.Element => {
    switch (name) {
      case 'search':
        return (
          <>
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </>
        );
      case 'send':
        return (
          <path
            d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        );
      case 'attach':
        return (
          <path
            d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        );
      case 'emoji':
        return (
          <>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </>
        );
      case 'mic':
        return (
          <>
            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </>
        );
      case 'more':
        return (
          <>
            <circle cx="12" cy="12" r="1" fill="currentColor" />
            <circle cx="19" cy="12" r="1" fill="currentColor" />
            <circle cx="5" cy="12" r="1" fill="currentColor" />
          </>
        );
      case 'close':
        return (
          <path
            d="M18 6L6 18M6 6l12 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      case 'check':
        return (
          <path
            d="M20 6L9 17l-5-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        );
      case 'check-double':
        return (
          <>
            <path d="M18 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M22 6L13 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </>
        );
      case 'arrow-left':
        return (
          <path
            d="M19 12H5M12 19l-7-7 7-7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      case 'menu':
        return (
          <>
            <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </>
        );
      case 'settings':
        return (
          <>
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none" />
            <path
              d="M12 1v3M12 20v3M20.49 5.5l-2.12 2.12M5.63 18.37l-2.12 2.12M23 12h-3M4 12H1M20.49 18.5l-2.12-2.12M5.63 5.63L3.51 3.51"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </>
        );
      default:
        return <circle cx="12" cy="12" r="10" fill="currentColor" />;
    }
  };

  return (
    <svg
      className={classNames}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={ariaLabel ?? name}
      role="img"
    >
      {getPath()}
    </svg>
  );
};
