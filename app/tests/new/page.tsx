'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Sparkles, Code, Plus, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { CRON_PRESETS_CLIENT } from '@/lib/scheduler-client';

const CRON_PRESETS = [
  { label: 'Every 5 minutes', value: '*/5 * * * *' },
  { label: 'Every 15 minutes', value: '*/15 * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every 6 hours', value: '0 */6 * * *' },
  { label: 'Daily at midnight', value: '0 0 * * *' },
  { label: 'Daily at 9am', value: '0 9 * * *' },
  { label: 'Weekly (Monday 9am)', value: '0 9 * * 1' },
];

type StepType = 'navigate' | 'click' | 'type' | 'assert' | 'wait' | 'screenshot' | 'custom';

interface Step {
  id: string;
  instruction: string;
  code?: string;
  type: StepType;
}

export default function NewTest() {
  const router = useRouter();
  const [tab, setTab] = useState<'ai' | 'manual'>('ai');
  const [testType, setTestType] = useState<'plain-english' | 'code'>('plain-english');

  // AI generation
  const [aiUrl, setAiUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedTests, setGeneratedTests] = useState<Array<{ name: string; description: string; steps: Step[] }>>([]);
  const [selectedGenerated, setSelectedGenerated] = useState<number | null>(null);

  // Manual
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<Step[]>([
    { id: 's1', instruction: '', type: 'navigate' },
  ]);
  const [schedule, setSchedule] = useState('');
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleGenerate() {
    if (!aiUrl) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/tests/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: aiUrl }),
      });
      const data = await res.json();
      setGeneratedTests(data.tests || []);
    } catch (e) {
      alert('Failed to generate tests. Check your API key.');
    }
    setGenerating(false);
  }

  function selectGenerated(idx: number) {
    const t = generatedTests[idx];
    setSelectedGenerated(idx);
    setName(t.name);
    setUrl(aiUrl);
    setDescription(t.description);
    setSteps(t.steps);
    setTab('manual');
  }

  function addStep() {
    setSteps(prev => [...prev, {
      id: `s${Date.now()}`,
      instruction: '',
      type: 'navigate',
    }]);
  }

  function removeStep(idx: number) {
    setSteps(prev => prev.filter((_, i) => i !== idx));
  }

  function updateStep(idx: number, key: string, value: string) {
    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, [key]: value } : s));
  }

  async function handleSave() {
    if (!name || !url || steps.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, url, description, steps, type: testType,
          schedule: scheduleEnabled ? schedule : null,
          schedule_enabled: scheduleEnabled,
        }),
      });
      const data = await res.json();
      router.push(`/tests/${data.id}`);
    } catch (e) {
      alert('Failed to save test.');
    }
    setSaving(false);
  }

  const stepTypeColors: Record<StepType, string> = {
    navigate: 'text-blue-400 bg-blue-400/10',
    click: 'text-amber-400 bg-amber-400/10',
    type: 'text-purple-400 bg-purple-400/10',
    assert: 'text-emerald-400 bg-emerald-400/10',
    wait: 'text-zinc-400 bg-zinc-400/10',
    screenshot: 'text-pink-400 bg-pink-400/10',
    custom: 'text-orange-400 bg-orange-400/10',
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar active="tests" />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto">
          <Link href="/tests" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm mb-6 transition-colors">
            <ArrowLeft size={14} />
            Back to Tests
          </Link>

          <h1 className="text-2xl font-semibold mb-6">New Test</h1>

          {/* Tab switcher */}
          <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg mb-6 w-fit">
            <button
              onClick={() => setTab('ai')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'ai' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Sparkles size={14} />
              AI Generate
            </button>
            <button
              onClick={() => setTab('manual')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'manual' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Code size={14} />
              Manual Build
            </button>
          </div>

          {/* AI Tab */}
          {tab === 'ai' && (
            <div className="animate-slide-in space-y-4">
              <div className="glow-card rounded-xl p-5">
                <h2 className="font-medium mb-1">Generate from URL</h2>
                <p className="text-sm text-zinc-500 mb-4">Enter a URL and AI will explore the page and create up to 8 comprehensive test cases.</p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={aiUrl}
                    onChange={e => setAiUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm font-mono placeholder-zinc-600"
                  />
                  <button
                    onClick={handleGenerate}
                    disabled={!aiUrl || generating}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-medium px-4 py-2.5 rounded-lg text-sm transition-colors"
                  >
                    {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    {generating ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              </div>

              {generatedTests.length > 0 && (
                <div className="space-y-3 animate-slide-in">
                  <p className="text-sm text-zinc-500">{generatedTests.length} tests generated — click one to edit and save:</p>
                  {generatedTests.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => selectGenerated(i)}
                      className="w-full text-left glow-card rounded-xl p-4 hover:border-emerald-500/40 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-medium text-sm text-zinc-200">{t.name}</div>
                          <div className="text-xs text-zinc-500 mt-1">{t.description}</div>
                        </div>
                        <span className="text-xs text-zinc-600 flex-shrink-0">{t.steps.length} steps</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Manual Tab */}
          {tab === 'manual' && (
            <div className="animate-slide-in space-y-5">
              {/* Test type toggle */}
              <div className="glow-card rounded-xl p-5 space-y-4">
                <div className="flex gap-3">
                  {(['plain-english', 'code'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setTestType(t)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors border ${testType === t ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' : 'border-zinc-700 text-zinc-500 hover:text-zinc-300'}`}
                    >
                      {t === 'plain-english' ? '✍️ Plain English' : '{ } Code'}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium block mb-1.5">Test Name</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Login flow test"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm placeholder-zinc-600"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium block mb-1.5">Target URL</label>
                  <input
                    type="url"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm font-mono placeholder-zinc-600"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium block mb-1.5">Description (optional)</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe what this test validates..."
                    rows={2}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm placeholder-zinc-600 resize-none"
                  />
                </div>
              </div>

              {/* Steps */}
              <div className="glow-card rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
                  <h3 className="font-medium text-sm">Steps</h3>
                  <span className="text-xs text-zinc-600 font-mono">{steps.length} steps</span>
                </div>
                <div className="p-4 space-y-2">
                  {steps.map((step, i) => (
                    <div key={step.id} className="flex gap-2 items-start animate-slide-in">
                      <span className="text-xs text-zinc-700 font-mono mt-2.5 w-4 text-right flex-shrink-0">{i + 1}</span>
                      <select
                        value={step.type}
                        onChange={e => updateStep(i, 'type', e.target.value)}
                        className={`flex-shrink-0 bg-zinc-900 border border-zinc-700 rounded-md px-2 py-2 text-xs font-mono ${stepTypeColors[step.type]} bg-opacity-20`}
                      >
                        {['navigate','click','type','assert','wait','screenshot','custom'].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      {testType === 'plain-english' ? (
                        <input
                          value={step.instruction}
                          onChange={e => updateStep(i, 'instruction', e.target.value)}
                          placeholder={
                            step.type === 'navigate' ? 'Go to https://...' :
                            step.type === 'click' ? 'Click "Login" button' :
                            step.type === 'type' ? 'Type "user@email.com" in #email' :
                            step.type === 'assert' ? 'Verify "Welcome" is visible' :
                            step.type === 'wait' ? 'Wait 2 seconds' :
                            'Instruction...'
                          }
                          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm placeholder-zinc-700"
                        />
                      ) : (
                        <textarea
                          value={step.code || ''}
                          onChange={e => updateStep(i, 'code', e.target.value)}
                          placeholder={`await page.click('#login-btn');`}
                          rows={2}
                          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-xs font-mono placeholder-zinc-700 resize-none"
                        />
                      )}
                      <button
                        onClick={() => removeStep(i)}
                        className="mt-2 text-zinc-700 hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addStep}
                    className="flex items-center gap-2 text-xs text-zinc-500 hover:text-emerald-400 transition-colors mt-2 ml-6"
                  >
                    <Plus size={12} />
                    Add step
                  </button>
                </div>
              </div>

              {/* Schedule */}
              <div className="glow-card rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-sm">Schedule</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Run this test automatically</p>
                  </div>
                  <button
                    onClick={() => setScheduleEnabled(!scheduleEnabled)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${scheduleEnabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${scheduleEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                {scheduleEnabled && (
                  <div className="space-y-2 animate-slide-in">
                    <div className="grid grid-cols-2 gap-2">
                      {CRON_PRESETS.map(p => (
                        <button
                          key={p.value}
                          onClick={() => setSchedule(p.value)}
                          className={`text-xs px-3 py-2 rounded-md border transition-colors text-left ${schedule === p.value ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' : 'border-zinc-700 text-zinc-500 hover:border-zinc-600'}`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                    <input
                      value={schedule}
                      onChange={e => setSchedule(e.target.value)}
                      placeholder="Custom cron: * * * * *"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-xs font-mono placeholder-zinc-700"
                    />
                  </div>
                )}
              </div>

              {/* Save */}
              <button
                onClick={handleSave}
                disabled={!name || !url || saving}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : null}
                {saving ? 'Saving...' : 'Save Test'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
