import { refreshFidePlayer } from '../../../../../packages/shared/src/fide';

const row = (id: string, name = 'Doe, Jane', rating = '2100') => `<tr><td>${id}</td><td>${name}</td><td>FM</td><td></td><td>AUS</td><td>${rating}</td><td>2200</td><td>-</td><td>1990</td></tr>`;
const response = (...rows: string[]) => ({ ok: true, text: async () => `<table id="table_results"><tbody>${rows.join('')}</tbody></table>` });
beforeEach(() => { global.fetch = jest.fn(); });

it('refreshes the exact ID among other results on each call without caching', async () => {
  (fetch as jest.Mock).mockResolvedValueOnce(response(row('99'), row('42'))).mockResolvedValueOnce(response(row('42', 'Doe, Jane', '2110')));
  expect((await refreshFidePlayer({ fideId: '42', name: 'Doe, Jane' })).standard).toBe('2100');
  expect((await refreshFidePlayer({ fideId: '42', name: 'Doe, Jane' })).standard).toBe('2110');
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ cache: 'no-store' }));
});
it('falls back to name search but still requires the saved ID', async () => {
  (fetch as jest.Mock).mockResolvedValueOnce(response()).mockResolvedValueOnce(response(row('99'), row('42')));
  expect((await refreshFidePlayer({ fideId: '42', name: 'Doe, Jane' })).fideId).toBe('42');
  expect((fetch as jest.Mock).mock.calls[1][0]).toContain('search=Doe%2C%20Jane');
});
it('never accepts a different ID even with the same name', async () => {
  (fetch as jest.Mock).mockResolvedValue(response(row('99')));
  await expect(refreshFidePlayer({ fideId: '42', name: 'Doe, Jane' })).rejects.toThrow(/match/i);
});
it('matches a unique normalized exact name without an ID', async () => {
  (fetch as jest.Mock).mockResolvedValue(response(row('99', 'Doe, Jane Jr'), row('42')));
  expect((await refreshFidePlayer({ name: '  DOE,   Jane ' })).fideId).toBe('42');
});
it('rejects ambiguous name-only matches', async () => {
  (fetch as jest.Mock).mockResolvedValue(response(row('99'), row('42')));
  await expect(refreshFidePlayer({ name: 'Doe, Jane' })).rejects.toThrow(/multiple/i);
});
it('rejects missing name matches', async () => {
  (fetch as jest.Mock).mockResolvedValue(response());
  await expect(refreshFidePlayer({ name: 'Doe, Jane' })).rejects.toThrow(/match/i);
});
