'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function InfoPage() {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string>('Not started yet');

  useEffect(() => {
    let isMounted = true;

    async function runKeepAliveQuery() {
      setStatus('loading');
      setMessage('Running Supabase keep-alive query...');

      try {
        // Simple query to make sure the database stays active.
        // We only need *a* query; the result itself is not important.
        const { data, error } = await supabase
          .from('games')
          .select('id')
          .limit(1);

        if (!isMounted) return;

        if (error) {
          console.error('Keep-alive Supabase error:', error);
          setStatus('error');
          setMessage(error.message);
          return;
        }

        const sampleId = data?.[0]?.id ?? null;
        setStatus('success');
        setMessage(
          sampleId
            ? `Successfully ran keep-alive query. Sample game id: ${sampleId}`
            : 'Successfully ran keep-alive query. No games found.',
        );
      } catch (err) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error('Keep-alive unexpected error:', err);
        setStatus('error');
        setMessage(msg);
      }
    }

    void runKeepAliveQuery();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow rounded-lg p-6 space-y-3">
        <h1 className="text-xl font-semibold text-gray-900">FIDE Calculator - Info</h1>
        <p className="text-sm text-gray-600">
          This page is used to keep the Supabase project warm by running a lightweight database query.
        </p>
        <div
          className={`text-sm px-3 py-2 rounded-md border ${
            status === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : status === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-gray-50 border-gray-200 text-gray-800'
          }`}
        >
          <span className="font-medium capitalize">{status}</span>: {message}
        </div>
      </div>
    </main>
  );
}

