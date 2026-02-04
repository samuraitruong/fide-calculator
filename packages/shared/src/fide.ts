export interface FidePlayer {
  fideId: string;
  name: string;
  title: string;
  trainerTitle: string;
  federation: string;
  standard: string;
  rapid: string;
  blitz: string;
  birthYear: string;
}

export function parseFideTable(html: string): FidePlayer[] {
  // For React Native, we'll need to use a different parser
  // For now, this is a placeholder that can be implemented with react-native-html-parser or similar
  if (typeof window === 'undefined' || !window.DOMParser) {
    // React Native environment - use alternative parser
    // This would need react-native-html-parser or similar library
    return [];
  }

  // Web environment
  const parser = new window.DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const table = doc.querySelector('#table_results');
  if (!table) return [];

  const rows = Array.from(table.querySelectorAll('tbody tr'));
  let players = rows.map((row) => {
    const cells = row.querySelectorAll('td');
    return {
      fideId: cells[0]?.textContent?.trim() || '',
      name: cells[1]?.textContent?.trim() || '',
      title: cells[2]?.textContent?.trim() || '',
      trainerTitle: cells[3]?.textContent?.trim() || '',
      federation:
        cells[4]?.textContent
          ?.replace(/[\n\r]+/g, '')
          .replace(/.*([A-Z]{3})$/, '$1')
          .trim() || '',
      standard: cells[5]?.textContent?.trim() || '',
      rapid: cells[6]?.textContent?.trim() || '',
      blitz: cells[7]?.textContent?.trim() || '',
      birthYear: cells[8]?.textContent?.trim() || '',
    };
  });

  // Sort: AUS federation to top, then by name
  players = players.sort((a, b) => {
    if (a.federation === 'AUS' && b.federation !== 'AUS') return -1;
    if (a.federation !== 'AUS' && b.federation === 'AUS') return 1;
    return a.name.localeCompare(b.name);
  });

  return players;
}

export async function searchFidePlayers(keyword: string): Promise<FidePlayer[]> {
  try {
    const url = `https://ratings.fide.com/incl_search_l.php?search=${keyword}&simple=1`;
    const response = await fetch('https://no-cors.fly.dev/cors/' + url, {
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch FIDE data');
    }
    
    const html = await response.text();
    return parseFideTable(html);
  } catch (error) {
    console.error('Error searching FIDE players:', error);
    throw error;
  }
}

