import type { ReactNode, HTMLAttributes } from 'react';
import './Typography.css';

export type TypographyVariant = 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label';
export type TypographyWeight = 'normal' | 'medium' | 'semibold' | 'bold';
export type TypographyColor = 'primary' | 'secondary' | 'tertiary' | 'success' | 'error';

export interface TypographyProps extends HTMLAttributes<HTMLElement> {
  /** 文字变体 */
  variant?: TypographyVariant;
  /** 文字粗细 */
  weight?: TypographyWeight;
  /** 文字颜色 */
  color?: TypographyColor;
  /** 是否截断文字 */
  truncate?: boolean;
  /** 子元素 */
  children: ReactNode;
  /** 自定义类名 */
  className?: string;
}

/**
 * Typography组件 - 文字排版原子组件
 * 提供一致的文字样式和层级
 */
export const Typography = ({
  variant = 'body',
  weight = 'normal',
  color = 'primary',
  truncate = false,
  children,
  className = '',
  ...props
}: TypographyProps): JSX.Element => {
  const classNames = [
    'typography',
    `typography-${variant}`,
    `typography-weight-${weight}`,
    `typography-color-${color}`,
    truncate && 'typography-truncate',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // 根据variant选择合适的HTML元素
  const Component = (() => {
    switch (variant) {
      case 'h1':
        return 'h1';
      case 'h2':
        return 'h2';
      case 'h3':
        return 'h3';
      case 'label':
        return 'label';
      case 'caption':
      case 'body':
      default:
        return 'span';
    }
  })();

  return (
    <Component className={classNames} {...props}>
      {children}
    </Component>
  );
};
