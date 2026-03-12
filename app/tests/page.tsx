'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { Plus, FlaskConical, ChevronRight, Calendar, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Test {
  id: string;
  name: string;
  url: string;
  description: string;
  type: string;
  schedule: string | null;
  schedule_enabled: number;
  created_at: string;
  last_run?: { status: string; created_at: string } | null;
  run_count?: number;
}

export default function TestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tests').then(r => r.json()).then(d => {
      setTests(d.tests || []);
      setLoading(false);
    });
  }, []);

  async function deleteTest(id: string, e: React.MouseEvent) {
    e.preventDefault();
    if (!confirm('Delete this test and all its runs?')) return;
    await fetch(`/api/tests/${id}`, { method: 'DELETE' });
    setTests(prev => prev.filter(t => t.id !== id));
  }

  const statusColor = (status?: string) => {
    if (!status) return 'bg-zinc-700';
    if (status === 'passed') return 'bg-emerald-500';
    if (status === 'failed') return 'bg-red-500';
    if (status === 'running') return 'bg-amber-500';
    return 'bg-orange-500';
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar active="tests" />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold">Tests</h1>
            <p className="text-zinc-500 text-sm mt-1">Manage your test suite</p>
          </div>
          <Link href="/tests/new" className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-medium px-4 py-2 rounded-lg text-sm transition-colors">
            <Plus size={16} />New Test
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}
          </div>
        ) : tests.length === 0 ? (
          <div className="text-center py-24">
            <FlaskConical size={40} className="text-zinc-800 mx-auto mb-4" />
            <p className="text-zinc-500">No tests yet</p>
            <Link href="/tests/new" className="text-emerald-400 text-sm mt-3 inline-block hover:text-emerald-300">
              Create your first test →
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {tests.map(test => (
              <Link
                key={test.id}
                href={`/tests/${test.id}`}
                className="glow-card rounded-xl p-5 flex items-center gap-4 group"
              >
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusColor(test.last_run?.status)}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-zinc-200">{test.name}</span>
                    <span className="text-xs font-mono text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">{test.type}</span>
                    {test.schedule_enabled ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-500">
                        <Calendar size={10} /> scheduled
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs text-zinc-600 font-mono truncate">{test.url}</div>
                  {test.description && <div className="text-xs text-zinc-500 mt-1 truncate">{test.description}</div>}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-zinc-500">{test.run_count || 0} runs</div>
                  <div className="text-xs text-zinc-600 mt-0.5">
                    {test.last_run ? formatDistanceToNow(new Date(test.last_run.created_at), { addSuffix: true }) : 'Never'}
                  </div>
                </div>
                <button
                  onClick={e => deleteTest(test.id, e)}
                  className="text-zinc-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 ml-1"
                >
                  <Trash2 size={15} />
                </button>
                <ChevronRight size={16} className="text-zinc-700 group-hover:text-zinc-500 transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
