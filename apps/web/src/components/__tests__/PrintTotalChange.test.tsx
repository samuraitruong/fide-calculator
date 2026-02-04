import { render, screen } from '@testing-library/react';
import PrintTotalChange from '../PrintTotalChange';

describe('PrintTotalChange', () => {
  it('renders with positive change', () => {
    render(<PrintTotalChange totalChange={5.6} />);
    
    const outerContainer = screen.getByText('+5.6').closest('.hidden');
    expect(outerContainer).toHaveClass('hidden', 'print:flex');
    expect(screen.getByText('+5.6')).toHaveClass('text-green-600');
  });

  it('renders with negative change', () => {
    render(<PrintTotalChange totalChange={-3.2} />);
    
    const outerContainer = screen.getByText('-3.2').closest('.hidden');
    expect(outerContainer).toHaveClass('hidden', 'print:flex');
    expect(screen.getByText('-3.2')).toHaveClass('text-red-600');
  });

  it('renders with zero change', () => {
    render(<PrintTotalChange totalChange={0} />);
    
    const outerContainer = screen.getByText('0').closest('.hidden');
    expect(outerContainer).toHaveClass('hidden', 'print:flex');
    expect(screen.getByText('0')).toHaveClass('text-red-600');
  });

  it('has correct styling classes', () => {
    render(<PrintTotalChange totalChange={5.6} />);
    
    const outerContainer = screen.getByText('+5.6').closest('.hidden');
    expect(outerContainer).toHaveClass('hidden', 'print:flex', 'w-full', 'items-center', 'justify-center', 'mb-5', 'mt-5');

    const circleContainer = outerContainer?.querySelector('div');
    expect(circleContainer).toHaveClass(
      'flex',
      'justify-center',
      'items-center',
      'w-[30vw]',
      'h-[30vw]',
      'min-w-[300px]',
      'min-h-[300px]',
      'max-w-[600px]',
      'max-h-[600px]',
      'rounded-full',
      'border-8',
      'border-gray-200',
      'bg-white',
      'shadow-lg'
    );

    const textElement = screen.getByText('+5.6');
    expect(textElement).toHaveClass('text-[8vw]', 'font-bold', 'text-green-600');
  });
}); 