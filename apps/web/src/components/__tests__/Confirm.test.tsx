import { render, screen, fireEvent } from '@testing-library/react';
import Confirm from '../Confirm';

describe('Confirm', () => {
  const defaultProps = {
    open: true,
    onCancel: jest.fn(),
    onConfirm: jest.fn(),
    title: 'Confirm',
    message: 'Are you sure?',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when open is false', () => {
    render(<Confirm {...defaultProps} open={false} />);
    expect(screen.queryByText('Confirm')).not.toBeInTheDocument();
  });

  it('renders confirmation dialog when open is true', () => {
    render(<Confirm {...defaultProps} />);
    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<Confirm {...defaultProps} />);
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    render(<Confirm {...defaultProps} />);
    const confirmButton = screen.getByRole('button', { name: 'Yes' });
    fireEvent.click(confirmButton);
    expect(defaultProps.onConfirm).toHaveBeenCalled();
  });

  it('has correct styling classes', () => {
    render(<Confirm {...defaultProps} />);
    
    const title = screen.getByText('Confirm');
    expect(title).toHaveClass('text-lg', 'tex', 'font-semibold', 'mb-2', 'text-center');

    const message = screen.getByText('Are you sure?');
    expect(message).toHaveClass('mb-4', 'text-center');

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    expect(cancelButton).toHaveClass('cursor-pointer', 'px-4', 'py-2', 'rounded', 'bg-gray-200', 'hover:bg-gray-300', 'text-gray-800', 'font-medium');

    const confirmButton = screen.getByRole('button', { name: 'Yes' });
    expect(confirmButton).toHaveClass('cursor-pointer', 'px-4', 'py-2', 'rounded', 'bg-red-600', 'hover:bg-red-700', 'text-white', 'font-medium');
  });
}); 