'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { Clock, Play } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface Run {
  id: string;
  test_id: string;
  test_name: string;
  status: string;
  started_at: string;
  duration_ms: number;
  created_at: string;
}

export default function RunsPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/runs').then(r => r.json()).then(d => {
      setRuns(d.runs || []);
      setLoading(false);
    });
  }, []);

  const statusColor: Record<string, string> = {
    passed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    failed: 'text-red-400 bg-red-500/10 border-red-500/20',
    running: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    pending: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
    error: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar active="runs" />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Runs</h1>
          <p className="text-zinc-500 text-sm mt-1">All test execution history</p>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-14 rounded-lg" />)}
          </div>
        ) : runs.length === 0 ? (
          <div className="text-center py-24">
            <Play size={40} className="text-zinc-800 mx-auto mb-4" />
            <p className="text-zinc-500 text-sm">No runs yet</p>
          </div>
        ) : (
          <div className="glow-card rounded-xl overflow-hidden">
            <div className="divide-y divide-zinc-800/60">
              {runs.map(run => (
                <Link
                  key={run.id}
                  href={`/tests/${run.test_id}`}
                  className="flex items-center gap-4 px-6 py-3.5 hover:bg-zinc-900/40 transition-colors"
                >
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-md border flex-shrink-0 ${statusColor[run.status] || statusColor.error}`}>
                    {run.status}
                  </span>
                  <span className="flex-1 text-sm text-zinc-300 truncate">{run.test_name}</span>
                  <span className="text-xs text-zinc-600 font-mono flex-shrink-0">
                    {format(new Date(run.created_at), 'MMM d, HH:mm:ss')}
                  </span>
                  {run.duration_ms && (
                    <span className="flex items-center gap-1 text-xs text-zinc-600 flex-shrink-0">
                      <Clock size={10} />{(run.duration_ms / 1000).toFixed(1)}s
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
