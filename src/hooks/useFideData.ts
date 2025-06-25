import { useState, useEffect, useCallback, useRef } from "react";

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

export function useFideData(initialKeyword: string): {
    fideData: FidePlayer[];
    loading: boolean;
    error: string | null;
    search: (keyword: string) => Promise<void>;
    history: Record<string, FidePlayer[]>;
} {
    const [fideData, setFideData] = useState<FidePlayer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [keyword, setKeyword] = useState(initialKeyword);
    const latestKeyword = useRef(initialKeyword);
    const [history, setHistory] = useState<Record<string, FidePlayer[]>>({});

    const search = useCallback(async (kw: string) => {
        setLoading(true);
        setError(null);
        setFideData([]);
        setKeyword(kw);
        latestKeyword.current = kw;
        try {
            const url = `https://ratings.fide.com/incl_search_l.php?search=${kw}&simple=1`;
            const response = await fetch('https://no-cors.fly.dev/cors/' + url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
            if (!response.ok) {
                throw new Error('Failed to fetch FIDE data');
            }
            const data = parseFideTable(await response.text());
            setHistory(prev => ({ ...prev, [kw]: data }));
            // Only update if keyword hasn't changed
            if (latestKeyword.current === kw) {
                setFideData(data);
            }
        } catch (err) {
            if (latestKeyword.current === kw) {
                setError(
                    err && typeof err === "object" && "message" in err
                        ? String((err as { message: unknown }).message)
                        : String(err)
                );
            }
        } finally {
            if (latestKeyword.current === kw) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        search(keyword);
    }, [keyword, search]);

    return { fideData, loading, error, search, history };
}

export function parseFideTable(html: string): FidePlayer[] {
    if (typeof window === "undefined" || !window.DOMParser) {
        // SSR/Node fallback: skip parsing
        return [];
    }
    const parser = new window.DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const table = doc.querySelector("#table_results");
    if (!table) return [];

    const rows = Array.from(table.querySelectorAll("tbody tr"));
    let players = rows.map((row) => {
        const cells = row.querySelectorAll("td");
        return {
            fideId: cells[0]?.textContent?.trim() || "",
            name: cells[1]?.textContent?.trim() || "",
            title: cells[2]?.textContent?.trim() || "",
            trainerTitle: cells[3]?.textContent?.trim() || "",
            federation: cells[4]?.textContent?.replace(/[\n\r]+/g, "").replace(/.*([A-Z]{3})$/, "$1").trim() || "",
            standard: cells[5]?.textContent?.trim() || "",
            rapid: cells[6]?.textContent?.trim() || "",
            blitz: cells[7]?.textContent?.trim() || "",
            birthYear: cells[8]?.textContent?.trim() || "",
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