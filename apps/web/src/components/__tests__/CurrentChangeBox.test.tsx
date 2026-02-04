import { render, screen } from '@testing-library/react';
import CurrentChangeBox from '../CurrentChangeBox';

describe('CurrentChangeBox', () => {
  it('renders positive change correctly', () => {
    render(<CurrentChangeBox currentRatingChange={5.6} />);
    
    expect(screen.getByText('Rating change')).toBeInTheDocument();
    expect(screen.getByText('5.6')).toBeInTheDocument();
    expect(screen.getByTestId('FaArrowUp')).toBeInTheDocument();
  });

  it('renders negative change correctly', () => {
    render(<CurrentChangeBox currentRatingChange={-5.6} />);
    
    expect(screen.getByText('Rating change')).toBeInTheDocument();
    expect(screen.getByText('5.6')).toBeInTheDocument();
    expect(screen.getByTestId('FaArrowDown')).toBeInTheDocument();
  });

  it('renders zero change correctly', () => {
    render(<CurrentChangeBox currentRatingChange={0} />);
    
    expect(screen.getByText('Rating change')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByTestId('FaMinus')).toBeInTheDocument();
  });

  it('has correct styling classes', () => {
    render(<CurrentChangeBox currentRatingChange={5.6} />);
    
    const container = screen.getByText('Rating change').closest('div');
    expect(container).toHaveClass('bg-white', 'rounded-xl', 'shadow-lg', 'current-change-box', 'h-auto', 'md:h-full', 'flex', 'flex-col', 'items-center', 'justify-start', 'md:justify-center', 'md:items-center', 'w-full');

    const title = screen.getByText('Rating change');
    expect(title).toHaveClass('text-3xl', 'font-bold', 'text-gray-700', 'mb-2', 'text-center');

    const valueContainer = screen.getByText('5.6').parentElement;
    expect(valueContainer).toHaveClass('text-[8rem]', 'font-bold', 'flex', 'items-center', 'gap-4');

    const valueText = screen.getByText('5.6');
    expect(valueText).toHaveClass('text-green-600');
  });
}); 