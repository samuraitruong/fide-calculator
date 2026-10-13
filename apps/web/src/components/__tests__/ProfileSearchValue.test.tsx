import React from 'react';
import { render, screen } from '@testing-library/react';
import FideSearchInput from '../FideSearchInput';
const search = jest.fn();
jest.mock('@/hooks/useFideData', () => ({ useFideData: () => ({ fideData: [], loading: false, search }) }));
it('shows supplied profile and refreshed name without opening the search dropdown', () => {
  const props = { onChange: jest.fn(), onSelect: jest.fn() };
  const view = render(<FideSearchInput {...props} value="Doe, Jane" />);
  expect(screen.getByRole('textbox')).toHaveValue('Doe, Jane');
  view.rerender(<FideSearchInput {...props} value="Updated Name" />);
  expect(screen.getByRole('textbox')).toHaveValue('Updated Name');
  expect(screen.queryByText('No players found')).not.toBeInTheDocument();
  expect(search).not.toHaveBeenCalled();
});
