'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Play, Plus, Clock, CheckCircle, XCircle, AlertCircle, Activity, Calendar, ChevronRight } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { formatDistanceToNow } from 'date-fns';

interface Test {
  id: string;
  name: string;
  url: string;
  description: string;
  schedule: string | null;
  schedule_enabled: number;
  created_at: string;
  last_run?: { status: string; created_at: string } | null;
  run_count?: number;
}

interface Stats {
  total_tests: number;
  total_runs: number;
  passed_runs: number;
  failed_runs: number;
  scheduled_tests: number;
}

export default function Dashboard() {
  const [tests, setTests] = useState<Test[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    const [testsRes, statsRes] = await Promise.all([
      fetch('/api/tests'),
      fetch('/api/tests/stats'),
    ]);
    const testsData = await testsRes.json();
    const statsData = await statsRes.json();
    setTests(testsData.tests || []);
    setStats(statsData);
    setLoading(false);
  }

  const statusIcon = (status?: string) => {
    if (!status) return <span className="w-2 h-2 rounded-full dot-pending inline-block" />;
    if (status === 'passed') return <span className="w-2 h-2 rounded-full dot-passed inline-block" />;
    if (status === 'failed') return <span className="w-2 h-2 rounded-full dot-failed inline-block" />;
    if (status === 'running') return <span className="w-2 h-2 rounded-full dot-running inline-block" />;
    return <span className="w-2 h-2 rounded-full dot-error inline-block" />;
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar active="dashboard" />
      <main className="flex-1 overflow-y-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Dashboard</h1>
            <p className="text-zinc-500 text-sm mt-1">Monitor all your web tests in one place</p>
          </div>
          <Link
            href="/tests/new"
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-medium px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <Plus size={16} />
            New Test
          </Link>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Tests', value: stats.total_tests, icon: Activity, color: 'text-emerald-400' },
              { label: 'Total Runs', value: stats.total_runs, icon: Play, color: 'text-blue-400' },
              { label: 'Passed', value: stats.passed_runs, icon: CheckCircle, color: 'text-emerald-400' },
              { label: 'Failed', value: stats.failed_runs, icon: XCircle, color: 'text-red-400' },
            ].map(s => (
              <div key={s.label} className="glow-card rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{s.label}</span>
                  <s.icon size={16} className={s.color} />
                </div>
                <div className="text-3xl font-semibold font-mono">{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tests List */}
        <div className="glow-card rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
            <h2 className="font-medium text-zinc-200">All Tests</h2>
            <span className="text-xs text-zinc-500 font-mono">{tests.length} total</span>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="skeleton h-14 w-full" />
              ))}
            </div>
          ) : tests.length === 0 ? (
            <div className="p-16 text-center">
              <Activity size={32} className="text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500 mb-2">No tests yet</p>
              <p className="text-zinc-600 text-sm mb-6">Create your first test to get started</p>
              <Link href="/tests/new" className="text-emerald-400 hover:text-emerald-300 text-sm font-medium">
                Create a test →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/60">
              {tests.map(test => (
                <Link key={test.id} href={`/tests/${test.id}`} className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-900/50 transition-colors group">
                  <div className="flex-shrink-0">
                    {statusIcon(test.last_run?.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-zinc-200 text-sm truncate">{test.name}</span>
                      {test.schedule_enabled ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                          <Calendar size={10} />
                          scheduled
                        </span>
                      ) : null}
                    </div>
                    <div className="text-xs text-zinc-600 truncate mt-0.5 font-mono">{test.url}</div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-xs text-zinc-500">
                      {test.last_run ? formatDistanceToNow(new Date(test.last_run.created_at), { addSuffix: true }) : 'Never run'}
                    </div>
                    <div className="text-xs text-zinc-600 mt-0.5">{test.run_count || 0} runs</div>
                  </div>
                  <ChevronRight size={16} className="text-zinc-700 group-hover:text-zinc-500 transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
