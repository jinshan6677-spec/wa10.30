import type { InputHTMLAttributes, TextareaHTMLAttributes} from 'react';
import React, { forwardRef } from 'react';
import './Input.css';

export type InputVariant = 'text' | 'search' | 'textarea';

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** 输入框变体 */
  variant?: 'text' | 'search';
  /** 是否有错误 */
  error?: boolean;
  /** 错误消息 */
  errorMessage?: string;
  /** 是否全宽 */
  fullWidth?: boolean;
}

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** 输入框变体 */
  variant: 'textarea';
  /** 是否有错误 */
  error?: boolean;
  /** 错误消息 */
  errorMessage?: string;
  /** 是否全宽 */
  fullWidth?: boolean;
}

export type InputComponentProps = InputProps | TextareaProps;

/**
 * Input组件 - 输入框原子组件
 * 支持text、search、textarea三种变体
 */
export const Input = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  InputComponentProps
>((props, ref) => {
  const {
    variant = 'text',
    error = false,
    errorMessage,
    fullWidth = false,
    className = '',
    ...restProps
  } = props;

  const classNames = [
    'input',
    `input-${variant}`,
    error && 'input-error',
    fullWidth && 'input-full-width',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (variant === 'textarea') {
    const textareaProps = restProps as TextareaHTMLAttributes<HTMLTextAreaElement>;
    return (
      <div className="input-wrapper">
        <textarea
          ref={ref as React.Ref<HTMLTextAreaElement>}
          className={classNames}
          aria-invalid={error}
          aria-describedby={error && errorMessage ? 'error-message' : undefined}
          {...textareaProps}
        />
        {error && errorMessage && (
          <span id="error-message" className="input-error-message" role="alert">
            {errorMessage}
          </span>
        )}
      </div>
    );
  }

  const inputProps = restProps as InputHTMLAttributes<HTMLInputElement>;

  return (
    <div className="input-wrapper">
      {variant === 'search' && (
        <svg
          className="input-search-icon"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7C2 9.76142 4.23858 12 7 12Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14 14L10.65 10.65"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <input
        ref={ref as React.Ref<HTMLInputElement>}
        type={variant === 'search' ? 'text' : 'text'}
        className={classNames}
        aria-invalid={error}
        aria-describedby={error && errorMessage ? 'error-message' : undefined}
        {...inputProps}
      />
      {error && errorMessage && (
        <span id="error-message" className="input-error-message" role="alert">
          {errorMessage}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
