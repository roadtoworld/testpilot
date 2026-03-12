'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { Play, ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, Calendar, ChevronDown, ChevronUp, Video, Camera } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface Step {
  id: string;
  instruction: string;
  type: string;
}

interface StepResult {
  stepId: string;
  instruction: string;
  status: 'passed' | 'failed' | 'skipped';
  error?: string;
  screenshot?: string;
  duration_ms: number;
}

interface Run {
  id: string;
  test_id: string;
  status: string;
  started_at: string;
  finished_at: string;
  duration_ms: number;
  screenshot_path: string | null;
  video_path: string | null;
  logs: string | null;
  error: string | null;
  steps_result: string | null;
  created_at: string;
}

interface Test {
  id: string;
  name: string;
  url: string;
  description: string;
  steps: string;
  type: string;
  schedule: string | null;
  schedule_enabled: number;
  created_at: string;
}

export default function TestDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [test, setTest] = useState<Test | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchAll();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [id]);

  async function fetchAll() {
    const [testRes, runsRes] = await Promise.all([
      fetch(`/api/tests/${id}`),
      fetch(`/api/runs?test_id=${id}`),
    ]);
    const testData = await testRes.json();
    const runsData = await runsRes.json();
    setTest(testData.test);
    setRuns(runsData.runs || []);
    setLoading(false);

    const hasRunning = (runsData.runs || []).some((r: Run) => r.status === 'running' || r.status === 'pending');
    if (hasRunning) {
      pollRef.current = setInterval(fetchAll, 2000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
  }

  async function triggerRun() {
    setRunning(true);
    await fetch(`/api/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test_id: id }),
    });
    setRunning(false);
    fetchAll();
    pollRef.current = setInterval(fetchAll, 2000);
  }

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      passed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      failed: 'text-red-400 bg-red-500/10 border-red-500/20',
      running: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      pending: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
      error: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    };
    return (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-md border ${styles[status] || styles.error}`}>
        {status}
      </span>
    );
  };

  const formatLog = (line: string) => {
    if (line.includes('✓') || line.includes('PASSED')) return <span className="log-pass">{line}</span>;
    if (line.includes('✗') || line.includes('FAILED') || line.includes('ERROR')) return <span className="log-fail">{line}</span>;
    if (line.includes('[NAV]')) return <span className="log-nav">{line}</span>;
    if (line.includes('[ERROR]') || line.includes('Error')) return <span className="log-error">{line}</span>;
    return <span className="log-info">{line}</span>;
  };

  if (loading) return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar active="tests" />
      <main className="flex-1 p-8"><div className="skeleton h-8 w-48 mb-4" /><div className="skeleton h-64 rounded-xl" /></main>
    </div>
  );

  if (!test) return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar active="tests" />
      <main className="flex-1 p-8 flex items-center justify-center text-zinc-500">Test not found</main>
    </div>
  );

  const steps: Step[] = JSON.parse(test.steps || '[]');

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar active="tests" />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto">
          <Link href="/tests" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm mb-6 transition-colors">
            <ArrowLeft size={14} />Back to Tests
          </Link>

          {/* Test header */}
          <div className="glow-card rounded-xl p-6 mb-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-semibold text-zinc-100">{test.name}</h1>
                  <span className="text-xs font-mono text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">{test.type}</span>
                </div>
                <div className="text-sm text-zinc-500 font-mono truncate">{test.url}</div>
                {test.description && <p className="text-sm text-zinc-500 mt-2">{test.description}</p>}
                {test.schedule_enabled && test.schedule && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-500">
                    <Calendar size={11} />
                    Scheduled: <span className="font-mono">{test.schedule}</span>
                  </div>
                )}
              </div>
              <button
                onClick={triggerRun}
                disabled={running}
                className="flex-shrink-0 flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-medium px-4 py-2.5 rounded-lg text-sm transition-colors"
              >
                <Play size={14} fill="black" />
                {running ? 'Starting...' : 'Run Now'}
              </button>
            </div>

            {/* Steps preview */}
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <div className="text-xs text-zinc-600 uppercase tracking-wider mb-2 font-medium">{steps.length} Steps</div>
              <div className="space-y-1.5">
                {steps.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-2 text-xs">
                    <span className="text-zinc-700 font-mono w-4 text-right">{i+1}</span>
                    <span className="text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded font-mono">{s.type}</span>
                    <span className="text-zinc-400 truncate">{s.instruction}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Run history */}
          <div className="glow-card rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="font-medium">Run History</h2>
              <span className="text-xs text-zinc-600 font-mono">{runs.length} runs</span>
            </div>

            {runs.length === 0 ? (
              <div className="p-12 text-center text-zinc-600 text-sm">
                No runs yet. Click "Run Now" to start.
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/60">
                {runs.map(run => {
                  const stepsResult: StepResult[] = run.steps_result ? JSON.parse(run.steps_result) : [];
                  const logs: string[] = run.logs ? JSON.parse(run.logs) : [];
                  const isExpanded = expandedRun === run.id;

                  return (
                    <div key={run.id}>
                      <button
                        onClick={() => setExpandedRun(isExpanded ? null : run.id)}
                        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-zinc-900/40 transition-colors text-left"
                      >
                        <div className="flex-1 flex items-center gap-3">
                          {statusBadge(run.status)}
                          <span className="text-xs text-zinc-500 font-mono">
                            {format(new Date(run.created_at), 'MMM d, HH:mm:ss')}
                          </span>
                          {run.duration_ms && (
                            <span className="flex items-center gap-1 text-xs text-zinc-600">
                              <Clock size={10} />
                              {(run.duration_ms / 1000).toFixed(1)}s
                            </span>
                          )}
                          {stepsResult.length > 0 && (
                            <span className="text-xs text-zinc-600">
                              {stepsResult.filter(s => s.status === 'passed').length}/{stepsResult.length} steps passed
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {run.video_path && <Video size={13} className="text-zinc-600" />}
                          {run.screenshot_path && <Camera size={13} className="text-zinc-600" />}
                          {isExpanded ? <ChevronUp size={14} className="text-zinc-600" /> : <ChevronDown size={14} className="text-zinc-600" />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-6 pb-5 space-y-4 animate-slide-in border-t border-zinc-800/50 pt-4">
                          {/* Video player */}
                          {run.video_path && (
                            <div>
                              <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2 flex items-center gap-1.5">
                                <Video size={11} /> Video Replay
                              </div>
                              <video
                                src={run.video_path}
                                controls
                                className="w-full rounded-lg border border-zinc-800 bg-black"
                                style={{ maxHeight: '300px' }}
                              />
                            </div>
                          )}

                          {/* Screenshot */}
                          {run.screenshot_path && (
                            <div>
                              <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2 flex items-center gap-1.5">
                                <Camera size={11} /> Final Screenshot
                              </div>
                              <img
                                src={run.screenshot_path}
                                alt="Test screenshot"
                                className="w-full rounded-lg border border-zinc-800"
                              />
                            </div>
                          )}

                          {/* Steps result */}
                          {stepsResult.length > 0 && (
                            <div>
                              <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2">Step Results</div>
                              <div className="space-y-1.5">
                                {stepsResult.map((sr, i) => (
                                  <div key={sr.stepId} className={`flex items-start gap-2 p-2 rounded-md text-xs ${sr.status === 'passed' ? 'bg-emerald-500/5' : 'bg-red-500/5'}`}>
                                    {sr.status === 'passed'
                                      ? <CheckCircle size={12} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                                      : <XCircle size={12} className="text-red-400 mt-0.5 flex-shrink-0" />
                                    }
                                    <div className="flex-1">
                                      <span className="text-zinc-300">{sr.instruction}</span>
                                      {sr.error && <div className="text-red-400 mt-0.5 font-mono">{sr.error}</div>}
                                      <span className="text-zinc-700 ml-2">{sr.duration_ms}ms</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Logs */}
                          {logs.length > 0 && (
                            <div>
                              <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2">Logs</div>
                              <div className="terminal">
                                {logs.map((line, i) => (
                                  <div key={i}>{formatLog(line)}</div>
                                ))}
                              </div>
                            </div>
                          )}

                          {run.error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-400 font-mono">
                              {run.error}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
