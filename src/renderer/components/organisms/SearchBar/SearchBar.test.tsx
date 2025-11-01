import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import '@testing-library/jest-dom';
import { SearchBar } from './SearchBar';

describe('SearchBar Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render search bar container', () => {
      const { container } = render(<SearchBar />);
      expect(container.querySelector('.search-bar-container')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      const { container } = render(<SearchBar className="custom-search" />);
      expect(container.querySelector('.search-bar-container')).toHaveClass('custom-search');
    });

    it('should render search input', () => {
      render(<SearchBar />);
      expect(screen.getByLabelText('Search chats')).toBeInTheDocument();
    });

    it('should render with default placeholder', () => {
      render(<SearchBar />);
      expect(screen.getByPlaceholderText('Search or start new chat')).toBeInTheDocument();
    });

    it('should render with custom placeholder', () => {
      render(<SearchBar placeholder="Find messages" />);
      expect(screen.getByPlaceholderText('Find messages')).toBeInTheDocument();
    });
  });

  describe('Search Input', () => {
    it('should update value when typing', () => {
      render(<SearchBar />);
      const input = screen.getByLabelText('Search chats');

      fireEvent.change(input, { target: { value: 'Alice' } });
      expect(input.value).toBe('Alice');
    });

    it('should show search icon', () => {
      const { container } = render(<SearchBar />);
      expect(container.querySelector('.input-search-icon')).toBeInTheDocument();
    });

    it('should be full width', () => {
      const { container } = render(<SearchBar />);
      const input = container.querySelector('input');
      expect(input).toHaveClass('input-full-width');
    });
  });

  describe('Debounce Functionality', () => {
    it('should not call onSearch immediately when typing', () => {
      const handleSearch = jest.fn();
      render(<SearchBar onSearch={handleSearch} />);

      const input = screen.getByLabelText('Search chats');
      fireEvent.change(input, { target: { value: 'test' } });

      expect(handleSearch).not.toHaveBeenCalled();
    });

    it('should call onSearch after default debounce delay (300ms)', async () => {
      const handleSearch = jest.fn();
      render(<SearchBar onSearch={handleSearch} />);

      const input = screen.getByLabelText('Search chats');
      fireEvent.change(input, { target: { value: 'test' } });

      expect(handleSearch).not.toHaveBeenCalled();

      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(handleSearch).toHaveBeenCalledWith('test');
        expect(handleSearch).toHaveBeenCalledTimes(1);
      });
    });

    it('should call onSearch after custom debounce delay', async () => {
      const handleSearch = jest.fn();
      render(<SearchBar onSearch={handleSearch} debounceDelay={500} />);

      const input = screen.getByLabelText('Search chats');
      fireEvent.change(input, { target: { value: 'test' } });

      jest.advanceTimersByTime(300);
      expect(handleSearch).not.toHaveBeenCalled();

      jest.advanceTimersByTime(200);

      await waitFor(() => {
        expect(handleSearch).toHaveBeenCalledWith('test');
      });
    });

    it('should cancel previous timer on rapid typing', async () => {
      const handleSearch = jest.fn();
      render(<SearchBar onSearch={handleSearch} />);

      const input = screen.getByLabelText('Search chats');

      fireEvent.change(input, { target: { value: 't' } });
      jest.advanceTimersByTime(100);

      fireEvent.change(input, { target: { value: 'te' } });
      jest.advanceTimersByTime(100);

      fireEvent.change(input, { target: { value: 'tes' } });
      jest.advanceTimersByTime(100);

      fireEvent.change(input, { target: { value: 'test' } });
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(handleSearch).toHaveBeenCalledWith('test');
        expect(handleSearch).toHaveBeenCalledTimes(1);
      });
    });

    it('should debounce each keystroke', async () => {
      const handleSearch = jest.fn();
      render(<SearchBar onSearch={handleSearch} debounceDelay={200} />);

      const input = screen.getByLabelText('Search chats');

      fireEvent.change(input, { target: { value: 'a' } });
      jest.advanceTimersByTime(200);

      await waitFor(() => {
        expect(handleSearch).toHaveBeenCalledWith('a');
      });

      fireEvent.change(input, { target: { value: 'ab' } });
      jest.advanceTimersByTime(200);

      await waitFor(() => {
        expect(handleSearch).toHaveBeenCalledWith('ab');
        expect(handleSearch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Search Query', () => {
    it('should pass correct query to onSearch', async () => {
      const handleSearch = jest.fn();
      render(<SearchBar onSearch={handleSearch} />);

      const input = screen.getByLabelText('Search chats');
      fireEvent.change(input, { target: { value: 'Alice Johnson' } });

      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(handleSearch).toHaveBeenCalledWith('Alice Johnson');
      });
    });

    it('should handle empty search query', async () => {
      const handleSearch = jest.fn();
      render(<SearchBar onSearch={handleSearch} />);

      const input = screen.getByLabelText('Search chats');

      // First type something
      fireEvent.change(input, { target: { value: 'test' } });
      jest.advanceTimersByTime(300);

      // Then clear it
      fireEvent.change(input, { target: { value: '' } });
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(handleSearch).toHaveBeenCalledWith('');
      });
    });

    it('should handle special characters in search', async () => {
      const handleSearch = jest.fn();
      render(<SearchBar onSearch={handleSearch} />);

      const input = screen.getByLabelText('Search chats');
      fireEvent.change(input, { target: { value: '@user #tag 你好' } });

      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(handleSearch).toHaveBeenCalledWith('@user #tag 你好');
      });
    });

    it('should not crash when onSearch is not provided', () => {
      render(<SearchBar />);

      const input = screen.getByLabelText('Search chats');
      fireEvent.change(input, { target: { value: 'test' } });

      jest.advanceTimersByTime(300);

      // Should not throw error
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label', () => {
      render(<SearchBar />);
      expect(screen.getByLabelText('Search chats')).toBeInTheDocument();
    });

    it('should have search variant input', () => {
      const { container } = render(<SearchBar />);
      const input = container.querySelector('input');
      expect(input).toHaveClass('input-search');
    });
  });

  describe('Performance', () => {
    it('should limit search calls with debounce', async () => {
      const handleSearch = jest.fn();
      render(<SearchBar onSearch={handleSearch} debounceDelay={300} />);

      const input = screen.getByLabelText('Search chats');

      // Simulate rapid typing
      for (let i = 0; i < 10; i += 1) {
        fireEvent.change(input, { target: { value: 'test'.substring(0, i + 1) } });
        jest.advanceTimersByTime(50);
      }

      // Fast forward to complete the last debounce
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        // Should only call once after all typing completed
        expect(handleSearch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('State Management', () => {
    it('should maintain internal query state', () => {
      render(<SearchBar />);
      const input = screen.getByLabelText('Search chats');

      fireEvent.change(input, { target: { value: 'First query' } });
      expect(input.value).toBe('First query');

      fireEvent.change(input, { target: { value: 'Second query' } });
      expect(input.value).toBe('Second query');
    });

    it('should clear query when input is cleared', () => {
      render(<SearchBar />);
      const input = screen.getByLabelText('Search chats');

      fireEvent.change(input, { target: { value: 'test' } });
      expect(input.value).toBe('test');

      fireEvent.change(input, { target: { value: '' } });
      expect(input.value).toBe('');
    });
  });

  describe('Combined Props', () => {
    it('should handle all props correctly', async () => {
      const handleSearch = jest.fn();
      const { container } = render(
        <SearchBar
          onSearch={handleSearch}
          placeholder="Custom placeholder"
          debounceDelay={400}
          className="custom"
        />,
      );

      expect(container.querySelector('.search-bar-container')).toHaveClass('custom');
      expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();

      const input = screen.getByLabelText('Search chats');
      fireEvent.change(input, { target: { value: 'test' } });

      jest.advanceTimersByTime(400);

      await waitFor(() => {
        expect(handleSearch).toHaveBeenCalledWith('test');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long search queries', async () => {
      const handleSearch = jest.fn();
      const longQuery = 'A'.repeat(500);
      render(<SearchBar onSearch={handleSearch} />);

      const input = screen.getByLabelText('Search chats');
      fireEvent.change(input, { target: { value: longQuery } });

      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(handleSearch).toHaveBeenCalledWith(longQuery);
      });
    });

    it('should handle zero debounce delay', async () => {
      const handleSearch = jest.fn();
      render(<SearchBar onSearch={handleSearch} debounceDelay={0} />);

      const input = screen.getByLabelText('Search chats');
      fireEvent.change(input, { target: { value: 'test' } });

      jest.advanceTimersByTime(0);

      await waitFor(() => {
        expect(handleSearch).toHaveBeenCalledWith('test');
      });
    });

    it('should handle whitespace-only search', async () => {
      const handleSearch = jest.fn();
      render(<SearchBar onSearch={handleSearch} />);

      const input = screen.getByLabelText('Search chats');
      fireEvent.change(input, { target: { value: '   ' } });

      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(handleSearch).toHaveBeenCalledWith('   ');
      });
    });
  });
});
