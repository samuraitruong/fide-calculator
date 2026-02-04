import { render, screen, fireEvent, act } from '@testing-library/react';
import InfoPopup from '../InfoPopup';

describe('InfoPopup', () => {
  const defaultProps = {
    content: <div>Test content</div>,
  };

  it('renders info button initially', () => {
    render(<InfoPopup {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: 'Show info' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('ml-1', 'text-blue-500', 'hover:text-blue-700', 'focus:outline-none');
  });

  it('shows popup when info button is clicked', async () => {
    render(<InfoPopup {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: 'Show info' });
    await act(async () => {
      fireEvent.click(button);
    });

    expect(screen.getByText('Test content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close info' })).toBeInTheDocument();
  });

  it('renders with title when provided', async () => {
    render(<InfoPopup {...defaultProps} title="Test Title" />);
    
    const button = screen.getByRole('button', { name: 'Show info' });
    await act(async () => {
      fireEvent.click(button);
    });

    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('closes popup when close button is clicked', async () => {
    render(<InfoPopup {...defaultProps} />);
    
    // Open popup
    const infoButton = screen.getByRole('button', { name: 'Show info' });
    await act(async () => {
      fireEvent.click(infoButton);
    });

    // Close popup
    const closeButton = screen.getByRole('button', { name: 'Close info' });
    await act(async () => {
      fireEvent.click(closeButton);
    });

    expect(screen.queryByText('Test content')).not.toBeInTheDocument();
  });

  it('closes popup when overlay is clicked', async () => {
    render(<InfoPopup {...defaultProps} />);
    
    // Open popup
    const infoButton = screen.getByRole('button', { name: 'Show info' });
    await act(async () => {
      fireEvent.click(infoButton);
    });

    // Click overlay
    const overlay = screen.getByRole('presentation');
    await act(async () => {
      fireEvent.click(overlay);
    });

    expect(screen.queryByText('Test content')).not.toBeInTheDocument();
  });

  it('has correct styling classes', async () => {
    render(<InfoPopup {...defaultProps} />);
    
    // Open popup
    const infoButton = screen.getByRole('button', { name: 'Show info' });
    await act(async () => {
      fireEvent.click(infoButton);
    });

    const popup = screen.getByText('Test content').closest('.bg-white');
    expect(popup).toHaveClass('bg-white', 'rounded-lg', 'shadow-xl', 'max-w-md', 'w-full', 'p-6', 'relative');

    const content = screen.getByText('Test content').parentElement;
    expect(content).toHaveClass('text-gray-700', 'text-sm', 'space-y-2');
  });

  it('prevents event propagation when clicking buttons', async () => {
    const mockEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
    };
    
    render(<InfoPopup {...defaultProps} />);
    
    const infoButton = screen.getByRole('button', { name: 'Show info' });
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    Object.assign(clickEvent, mockEvent);
    
    await act(async () => {
      infoButton.dispatchEvent(clickEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
  });
}); 