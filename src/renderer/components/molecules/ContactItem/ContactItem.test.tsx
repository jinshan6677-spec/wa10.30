import { render, screen, fireEvent } from '@testing-library/react';

import '@testing-library/jest-dom';
import { ContactItem } from './ContactItem';

describe('ContactItem Component', () => {
  const defaultProps = {
    name: 'John Doe',
  };

  describe('Rendering', () => {
    it('should render contact name', () => {
      render(<ContactItem {...defaultProps} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      const { container } = render(
        <ContactItem {...defaultProps} className="custom-contact" />,
      );
      expect(container.querySelector('.contact-item')).toHaveClass('custom-contact');
    });

    it('should have base contact-item class', () => {
      const { container } = render(<ContactItem {...defaultProps} />);
      expect(container.querySelector('.contact-item')).toBeInTheDocument();
    });

    it('should render Avatar component', () => {
      render(<ContactItem {...defaultProps} />);
      expect(screen.getByRole('img')).toBeInTheDocument();
    });
  });

  describe('Last Message', () => {
    it('should display last message when provided', () => {
      render(
        <ContactItem {...defaultProps} lastMessage="Hello, how are you?" />,
      );
      expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
    });

    it('should not display last message when not provided', () => {
      const { container } = render(<ContactItem {...defaultProps} />);
      expect(container.querySelector('.contact-item-message')).not.toBeInTheDocument();
    });

    it('should truncate long last messages', () => {
      const { container } = render(
        <ContactItem
          {...defaultProps}
          lastMessage="This is a very long message that should be truncated"
        />,
      );
      const messageElement = container.querySelector('.contact-item-message');
      expect(messageElement).toHaveClass('typography-truncate');
    });
  });

  describe('Last Message Time', () => {
    it('should display time when provided', () => {
      render(<ContactItem {...defaultProps} lastMessageTime="10:30 AM" />);
      expect(screen.getByText('10:30 AM')).toBeInTheDocument();
    });

    it('should not display time when not provided', () => {
      const { container } = render(<ContactItem {...defaultProps} />);
      expect(container.querySelector('.contact-item-time')).not.toBeInTheDocument();
    });
  });

  describe('Avatar', () => {
    it('should pass avatarSrc to Avatar component', () => {
      const { container } = render(
        <ContactItem {...defaultProps} avatarSrc="https://example.com/avatar.jpg" />,
      );
      const img = container.querySelector('.contact-item img');
      expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('should show online status when provided', () => {
      const { container } = render(
        <ContactItem {...defaultProps} status="online" />,
      );
      expect(container.querySelector('.avatar-status-online')).toBeInTheDocument();
    });

    it('should not show status when not provided', () => {
      const { container } = render(<ContactItem {...defaultProps} />);
      expect(container.querySelector('.avatar-status')).not.toBeInTheDocument();
    });
  });

  describe('Unread Count', () => {
    it('should not show badge when unreadCount is 0', () => {
      render(<ContactItem {...defaultProps} unreadCount={0} />);
      expect(screen.queryByLabelText(/unread messages/i)).not.toBeInTheDocument();
    });

    it('should show badge with unread count', () => {
      render(<ContactItem {...defaultProps} unreadCount={5} />);
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByLabelText('5 unread messages')).toBeInTheDocument();
    });

    it('should show 99+ for counts over 99', () => {
      render(<ContactItem {...defaultProps} unreadCount={150} />);
      expect(screen.getByText('99+')).toBeInTheDocument();
      expect(screen.getByLabelText('150 unread messages')).toBeInTheDocument();
    });

    it('should show exact count for 99', () => {
      render(<ContactItem {...defaultProps} unreadCount={99} />);
      expect(screen.getByText('99')).toBeInTheDocument();
    });

    it('should have contact-item-badge class', () => {
      const { container } = render(<ContactItem {...defaultProps} unreadCount={3} />);
      expect(container.querySelector('.contact-item-badge')).toBeInTheDocument();
    });
  });

  describe('Active State', () => {
    it('should not have active class by default', () => {
      const { container } = render(<ContactItem {...defaultProps} />);
      expect(container.querySelector('.contact-item')).not.toHaveClass('contact-item-active');
    });

    it('should have active class when active is true', () => {
      const { container } = render(<ContactItem {...defaultProps} active />);
      expect(container.querySelector('.contact-item')).toHaveClass('contact-item-active');
    });
  });

  describe('Interactions', () => {
    it('should call onClick when clicked', () => {
      const handleClick = jest.fn();
      render(<ContactItem {...defaultProps} onClick={handleClick} />);
      const item = screen.getByRole('button');
      fireEvent.click(item);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not crash when onClick is not provided', () => {
      render(<ContactItem {...defaultProps} />);
      const item = screen.getByRole('button');
      fireEvent.click(item);
      // Should not throw error
    });

    it('should call onClick when Enter key is pressed', () => {
      const handleClick = jest.fn();
      render(<ContactItem {...defaultProps} onClick={handleClick} />);
      const item = screen.getByRole('button');
      fireEvent.keyDown(item, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick when Space key is pressed', () => {
      const handleClick = jest.fn();
      render(<ContactItem {...defaultProps} onClick={handleClick} />);
      const item = screen.getByRole('button');
      fireEvent.keyDown(item, { key: ' ' });
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick for other keys', () => {
      const handleClick = jest.fn();
      render(<ContactItem {...defaultProps} onClick={handleClick} />);
      const item = screen.getByRole('button');
      fireEvent.keyDown(item, { key: 'a' });
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should call onContextMenu when right-clicked', () => {
      const handleContextMenu = jest.fn();
      render(<ContactItem {...defaultProps} onContextMenu={handleContextMenu} />);
      const item = screen.getByRole('button');
      fireEvent.contextMenu(item);
      expect(handleContextMenu).toHaveBeenCalledTimes(1);
    });

    it('should not crash when onContextMenu is not provided', () => {
      render(<ContactItem {...defaultProps} />);
      const item = screen.getByRole('button');
      fireEvent.contextMenu(item);
      // Should not throw error
    });
  });

  describe('Accessibility', () => {
    it('should have button role', () => {
      render(<ContactItem {...defaultProps} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should have appropriate aria-label', () => {
      render(<ContactItem name="Alice" />);
      expect(screen.getByRole('button', { name: 'Chat with Alice' })).toBeInTheDocument();
    });

    it('should be keyboard focusable with tabIndex 0', () => {
      render(<ContactItem {...defaultProps} />);
      const item = screen.getByRole('button');
      expect(item).toHaveAttribute('tabIndex', '0');
    });

    it('should have aria-label for unread badge', () => {
      render(<ContactItem {...defaultProps} unreadCount={3} />);
      expect(screen.getByLabelText('3 unread messages')).toBeInTheDocument();
    });
  });

  describe('Typography Usage', () => {
    it('should render name with proper Typography', () => {
      const { container } = render(<ContactItem {...defaultProps} />);
      expect(container.querySelector('.contact-item-name')).toBeInTheDocument();
    });

    it('should truncate contact name', () => {
      const { container } = render(<ContactItem name="Very Long Contact Name That Should Be Truncated" />);
      const nameElement = container.querySelector('.contact-item-name');
      expect(nameElement).toHaveClass('typography-truncate');
    });
  });

  describe('Combined Props', () => {
    it('should handle all props correctly', () => {
      const handleClick = jest.fn();
      const { container } = render(
        <ContactItem
          name="Jane Doe"
          lastMessage="See you tomorrow!"
          lastMessageTime="Yesterday"
          avatarSrc="avatar.jpg"
          status="online"
          unreadCount={2}
          active
          onClick={handleClick}
          className="custom"
        />,
      );

      // Check all elements are rendered
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('See you tomorrow!')).toBeInTheDocument();
      expect(screen.getByText('Yesterday')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(container.querySelector('.contact-item')).toHaveClass('contact-item-active', 'custom');
      expect(container.querySelector('.avatar-status-online')).toBeInTheDocument();

      // Check interaction
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('Pin State', () => {
    it('should not show pin icon by default', () => {
      const { container } = render(<ContactItem {...defaultProps} />);
      expect(container.querySelector('.contact-item-pin-icon')).not.toBeInTheDocument();
    });

    it('should show pin icon when isPinned is true', () => {
      const { container } = render(<ContactItem {...defaultProps} isPinned />);
      expect(container.querySelector('.contact-item-pin-icon')).toBeInTheDocument();
    });

    it('should have proper aria-label for pin icon', () => {
      render(<ContactItem {...defaultProps} isPinned />);
      expect(screen.getByLabelText('Pinned')).toBeInTheDocument();
    });

    it('should not show pin icon when isPinned is false', () => {
      const { container } = render(<ContactItem {...defaultProps} isPinned={false} />);
      expect(container.querySelector('.contact-item-pin-icon')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty name gracefully', () => {
      render(<ContactItem name="" />);
      // Should render without crashing
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle very long names', () => {
      const longName = 'A'.repeat(100);
      render(<ContactItem name={longName} />);
      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it('should handle special characters in name', () => {
      render(<ContactItem name="João São Paulo 你好" />);
      expect(screen.getByText('João São Paulo 你好')).toBeInTheDocument();
    });
  });
});
