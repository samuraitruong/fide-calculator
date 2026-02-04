import { useState, useEffect, useCallback, useRef } from "react";
import { FidePlayer, searchFidePlayers } from "@fide-calculator/shared";

// Re-export for backward compatibility
export type { FidePlayer };

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
            const data = await searchFidePlayers(kw);
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

// Re-export parseFideTable for backward compatibility
export { parseFideTable } from "@fide-calculator/shared";