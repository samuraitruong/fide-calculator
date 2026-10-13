import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ListRatingChange from '../ListRatingChange';
import type { Result } from '@/util/types';
jest.mock('react-dnd', () => ({DndProvider: ({children}: { children?: React.ReactNode }) => children, useDrag: () => [{isDragging: false}, () => {}], useDrop: () => [{}, () => {}]}));
jest.mock('react-dnd-html5-backend', () => ({HTML5Backend: {}}));
jest.mock('@/contexts/AuthContext', () => ({useAuth: () => ({activeProfile: null})}));
jest.mock('@/hooks/useLocalStorage', () => ({useLocalStorage: () => ({activeProfile: null})}));
jest.mock('../ImportExport', () => () => null);
const game: Result = {id: 'selected', date: '2025-12-31', ratingMonth: '2026-01', playerRating: 1800, opponentName: 'Player', opponentRating: 1700, kFactor: 20, result: 'win', ratingChange: 5, ratingType: 'standard'};
it('confirms deletion with selected identity after data order changes', async () => {
 const remove = jest.fn(); const other = {...game, id: 'other', opponentName: 'Other'};
 const {rerender} = render(<ListRatingChange results={[game, other]} onRemove={remove} />);
 fireEvent.click(screen.getAllByTitle('Delete entry')[0]); expect(remove).not.toHaveBeenCalled();
 rerender(<ListRatingChange results={[other, game]} onRemove={remove} />);
 fireEvent.click(screen.getByText('Remove'));
 await waitFor(() => expect(remove).toHaveBeenCalledWith(game));
});
it('failed deletion retains confirmation and error', async () => {
 const remove = jest.fn().mockRejectedValue(new Error('Delete failed'));
 render(<ListRatingChange results={[game]} onRemove={remove} />);
 fireEvent.click(screen.getAllByTitle('Delete entry')[0]); fireEvent.click(screen.getByText('Remove'));
 await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Delete failed'));
 expect(screen.getByText('Remove Rating Change')).toBeInTheDocument();
});
it('read-only month has no delete button', () => {
 render(<ListRatingChange results={[game]} onRemove={jest.fn()} readOnly />);
 expect(screen.queryByTitle('Delete entry')).not.toBeInTheDocument();
});
