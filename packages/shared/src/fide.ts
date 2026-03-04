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

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function stripTags(input: string): string {
  return decodeHtmlEntities(input.replace(/<[^>]*>/g, ' '))
    .replace(/[\n\r\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseFideTableWithoutDom(html: string): FidePlayer[] {
  // Extract table with id="table_results"
  const tableMatch = html.match(
    /<table[^>]*id=["']table_results["'][\s\S]*?<\/table>/i,
  );
  const tableHtml = tableMatch?.[0];
  if (!tableHtml) return [];

  // Extract rows from tbody if present, otherwise all rows
  const tbodyMatch = tableHtml.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
  const rowsHtml = tbodyMatch ? tbodyMatch[1] : tableHtml;

  const rowMatches = rowsHtml.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
  const players: FidePlayer[] = [];

  for (const rowHtml of rowMatches) {
    const cellMatches = rowHtml.match(/<td[\s\S]*?<\/td>/gi) ?? [];
    if (cellMatches.length < 9) continue;

    const cells = cellMatches.map((c) => stripTags(c));

    const federationRaw = cells[4] ?? '';
    const federation = federationRaw.replace(/.*([A-Z]{3})$/, '$1').trim();

    players.push({
      fideId: cells[0] ?? '',
      name: cells[1] ?? '',
      title: cells[2] ?? '',
      trainerTitle: cells[3] ?? '',
      federation: federation || federationRaw,
      standard: cells[5] ?? '',
      rapid: cells[6] ?? '',
      blitz: cells[7] ?? '',
      birthYear: cells[8] ?? '',
    });
  }

  // Sort: AUS federation to top, then by name
  return players.sort((a, b) => {
    if (a.federation === 'AUS' && b.federation !== 'AUS') return -1;
    if (a.federation !== 'AUS' && b.federation === 'AUS') return 1;
    return a.name.localeCompare(b.name);
  });
}

export function parseFideTable(html: string): FidePlayer[] {
  // Non-browser environments (React Native, SSR) — parse via regex.
  if (typeof window === 'undefined' || !window.DOMParser) {
    return parseFideTableWithoutDom(html);
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

