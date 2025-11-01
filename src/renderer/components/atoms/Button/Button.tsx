import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'icon';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 按钮变体 */
  variant?: ButtonVariant;
  /** 按钮大小 */
  size?: ButtonSize;
  /** 是否为全宽按钮 */
  fullWidth?: boolean;
  /** 是否显示加载状态 */
  loading?: boolean;
  /** 按钮内容 */
  children: ReactNode;
  /** 无障碍标签 */
  'aria-label'?: string;
}

/**
 * Button组件 - 按钮原子组件
 * 支持primary、secondary、icon三种变体
 */
export const Button = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
  className = '',
  children,
  'aria-label': ariaLabel,
  ...props
}: ButtonProps): JSX.Element => {
  const classNames = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth && 'btn-full-width',
    loading && 'btn-loading',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classNames}
      disabled={disabled ?? loading}
      aria-label={ariaLabel}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <span className="btn-spinner" aria-hidden="true">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="8"
              cy="8"
              r="6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="30 30"
              className="loading"
            />
          </svg>
        </span>
      )}
      <span className="btn-content">{children}</span>
    </button>
  );
};
