import { render, screen } from '@testing-library/react';

import '@testing-library/jest-dom';
import { ChatHeader } from './ChatHeader';

describe('ChatHeader Component', () => {
  const defaultProps = {
    name: 'John Doe',
  };

  describe('Rendering', () => {
    it('should render contact name', () => {
      render(<ChatHeader {...defaultProps} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      const { container } = render(
        <ChatHeader {...defaultProps} className="custom-header" />,
      );
      expect(container.querySelector('.chat-header')).toHaveClass('custom-header');
    });

    it('should have base chat-header class', () => {
      const { container } = render(<ChatHeader {...defaultProps} />);
      expect(container.querySelector('.chat-header')).toBeInTheDocument();
    });
  });

  describe('Avatar', () => {
    it('should render Avatar component', () => {
      const { container } = render(<ChatHeader {...defaultProps} />);
      const avatar = container.querySelector('.avatar[role="img"]');
      expect(avatar).toBeInTheDocument();
    });

    it('should pass avatarSrc to Avatar', () => {
      render(
        <ChatHeader {...defaultProps} avatarSrc="https://example.com/avatar.jpg" />,
      );
      const img = screen.getByAltText('John Doe');
      expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('should display online status when provided', () => {
      const { container } = render(
        <ChatHeader {...defaultProps} status="online" />,
      );
      expect(container.querySelector('.avatar-status-online')).toBeInTheDocument();
    });

    it('should not show status when not provided', () => {
      const { container } = render(<ChatHeader {...defaultProps} />);
      expect(container.querySelector('.avatar-status')).not.toBeInTheDocument();
    });

    it('should display away status', () => {
      const { container } = render(
        <ChatHeader {...defaultProps} status="away" />,
      );
      expect(container.querySelector('.avatar-status-away')).toBeInTheDocument();
    });

    it('should display offline status', () => {
      const { container } = render(
        <ChatHeader {...defaultProps} status="offline" />,
      );
      expect(container.querySelector('.avatar-status-offline')).toBeInTheDocument();
    });
  });

  describe('Status Text', () => {
    it('should display status text when provided', () => {
      render(<ChatHeader {...defaultProps} statusText="online" />);
      expect(screen.getByText('online')).toBeInTheDocument();
    });

    it('should not display status text when not provided', () => {
      render(<ChatHeader {...defaultProps} />);
      expect(screen.queryByText('online')).not.toBeInTheDocument();
    });

    it('should display "typing..." status text', () => {
      render(<ChatHeader {...defaultProps} statusText="typing..." />);
      expect(screen.getByText('typing...')).toBeInTheDocument();
    });

    it('should display custom status text', () => {
      render(<ChatHeader {...defaultProps} statusText="last seen today at 10:30 AM" />);
      expect(screen.getByText('last seen today at 10:30 AM')).toBeInTheDocument();
    });
  });

  describe('Header Info Section', () => {
    it('should have chat-header-info container', () => {
      const { container } = render(<ChatHeader {...defaultProps} />);
      expect(container.querySelector('.chat-header-info')).toBeInTheDocument();
    });

    it('should have chat-header-text container', () => {
      const { container } = render(<ChatHeader {...defaultProps} />);
      expect(container.querySelector('.chat-header-text')).toBeInTheDocument();
    });

    it('should display name and status text in correct order', () => {
      const { container } = render(
        <ChatHeader {...defaultProps} statusText="online" />,
      );
      const textContainer = container.querySelector('.chat-header-text');
      expect(textContainer?.textContent).toContain('John Doeonline');
    });
  });

  describe('Action Buttons', () => {
    it('should have chat-header-actions container', () => {
      const { container } = render(<ChatHeader {...defaultProps} />);
      expect(container.querySelector('.chat-header-actions')).toBeInTheDocument();
    });

    it('should render search button', () => {
      render(<ChatHeader {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Search in conversation' })).toBeInTheDocument();
    });

    it('should render more options button', () => {
      render(<ChatHeader {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'More options' })).toBeInTheDocument();
    });

    it('should render two action buttons', () => {
      render(<ChatHeader {...defaultProps} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
    });

    it('should render search icon in search button', () => {
      const { container } = render(<ChatHeader {...defaultProps} />);
      const actions = container.querySelector('.chat-header-actions');
      const svgs = actions?.querySelectorAll('svg');
      expect(svgs?.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-labels for action buttons', () => {
      render(<ChatHeader {...defaultProps} />);
      expect(screen.getByLabelText('Search in conversation')).toBeInTheDocument();
      expect(screen.getByLabelText('More options')).toBeInTheDocument();
    });

    it('should use Button components with icon variant', () => {
      const { container } = render(<ChatHeader {...defaultProps} />);
      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('btn-icon');
      });
    });
  });

  describe('Typography Usage', () => {
    it('should render name with medium weight Typography', () => {
      render(<ChatHeader {...defaultProps} />);
      // Name should be rendered with Typography component
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should render status text with caption Typography', () => {
      render(<ChatHeader {...defaultProps} statusText="typing..." />);
      expect(screen.getByText('typing...')).toBeInTheDocument();
    });
  });

  describe('Layout Structure', () => {
    it('should have info section on the left', () => {
      const { container } = render(<ChatHeader {...defaultProps} />);
      const header = container.querySelector('.chat-header');
      const info = container.querySelector('.chat-header-info');
      expect(header?.firstElementChild).toBe(info);
    });

    it('should have actions section on the right', () => {
      const { container } = render(<ChatHeader {...defaultProps} />);
      const header = container.querySelector('.chat-header');
      const actions = container.querySelector('.chat-header-actions');
      expect(header?.lastElementChild).toBe(actions);
    });
  });

  describe('Combined Props', () => {
    it('should handle all props correctly', () => {
      const { container } = render(
        <ChatHeader
          name="Alice Smith"
          avatarSrc="alice.jpg"
          status="online"
          statusText="online"
          className="custom"
        />,
      );

      // Check all elements
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('online')).toBeInTheDocument();
      expect(screen.getByAltText('Alice Smith')).toHaveAttribute('src', 'alice.jpg');
      expect(container.querySelector('.avatar-status-online')).toBeInTheDocument();
      expect(container.querySelector('.chat-header')).toHaveClass('custom');

      // Check action buttons
      expect(screen.getByLabelText('Search in conversation')).toBeInTheDocument();
      expect(screen.getByLabelText('More options')).toBeInTheDocument();
    });

    it('should work with minimal props', () => {
      render(<ChatHeader name="Bob" />);
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getAllByRole('button')).toHaveLength(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty name', () => {
      render(<ChatHeader name="" />);
      const { container } = render(<ChatHeader name="" />);
      expect(container.querySelector('.chat-header')).toBeInTheDocument();
    });

    it('should handle very long names', () => {
      const longName = 'A'.repeat(100);
      render(<ChatHeader name={longName} />);
      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it('should handle special characters in name', () => {
      render(<ChatHeader name="José María 你好" />);
      expect(screen.getByText('José María 你好')).toBeInTheDocument();
    });

    it('should handle very long status text', () => {
      const longStatus = 'Last seen yesterday at 11:45 PM in a different timezone';
      render(<ChatHeader {...defaultProps} statusText={longStatus} />);
      expect(screen.getByText(longStatus)).toBeInTheDocument();
    });
  });

  describe('Icon Components', () => {
    it('should render Icon components for buttons', () => {
      const { container } = render(<ChatHeader {...defaultProps} />);
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBe(2); // search and more icons
    });

    it('should use correct icon names', () => {
      const { container } = render(<ChatHeader {...defaultProps} />);
      // Both icons should be rendered as SVG elements
      const actions = container.querySelector('.chat-header-actions');
      expect(actions?.querySelectorAll('svg')).toHaveLength(2);
    });
  });
});
