import { render, screen } from '@testing-library/react';
import KFactorHelp from '../KFactorHelp';

describe('KFactorHelp', () => {
  it('renders the K value explanation', () => {
    render(<KFactorHelp />);
    const kValueText = screen.getByText(/K val/);
    expect(kValueText).toBeInTheDocument();
    expect(kValueText.parentElement).toHaveTextContent('K is the development coefficient');
  });

  it('renders all K-factor rules', () => {
    render(<KFactorHelp />);
    
    // Check for all K-factor rules
    expect(screen.getByText(/K = 40 for a player new to the rating list until he has completed events with at least 30 games/)).toBeInTheDocument();
    expect(screen.getByText(/K = 20 as long as a player's rating remains under 2400./)).toBeInTheDocument();
    expect(screen.getByText(/K = 10 once a player's published rating has reached 2400 and remains at that level subsequently, even if the rating drops below 2400./)).toBeInTheDocument();
    expect(screen.getByText(/K = 40 for all players until their 18th birthday, as long as their rating remains under 2300./)).toBeInTheDocument();
  });

  it('renders hidden legacy notes', () => {
    render(<KFactorHelp />);
    
    // Check for hidden legacy notes
    const hiddenDivs = screen.getAllByText(/Rating|Rc|W/).map(el => el.closest('div'));
    hiddenDivs.forEach(div => {
      expect(div).toHaveClass('hidden');
    });
  });

  it('renders the list with correct styling', () => {
    render(<KFactorHelp />);
    
    const list = screen.getByRole('list');
    expect(list).toHaveClass('list-disc', 'pl-5', 'mt-2', 'space-y-1');
  });
}); 