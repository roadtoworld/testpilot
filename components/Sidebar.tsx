'use client';
import Link from 'next/link';
import { Activity, FlaskConical, Play, Settings, Zap } from 'lucide-react';
import clsx from 'clsx';

const nav = [
  { label: 'Dashboard', href: '/dashboard', key: 'dashboard', icon: Activity },
  { label: 'Tests', href: '/tests', key: 'tests', icon: FlaskConical },
  { label: 'Runs', href: '/runs', key: 'runs', icon: Play },
];

export default function Sidebar({ active }: { active: string }) {
  return (
    <aside className="w-56 flex-shrink-0 bg-zinc-900/60 border-r border-zinc-800/60 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-zinc-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
            <Zap size={14} className="text-black" fill="black" />
          </div>
          <span className="font-semibold text-zinc-100 tracking-tight">TestPilot</span>
        </div>
        <p className="text-xs text-zinc-600 mt-1 ml-9">AI-powered testing</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(item => (
          <Link
            key={item.key}
            href={item.href}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
              active === item.key
                ? 'bg-emerald-500/10 text-emerald-400 font-medium'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
            )}
          >
            <item.icon size={16} />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4">
        <div className="px-3 py-2.5 rounded-lg bg-zinc-800/40 border border-zinc-700/30">
          <p className="text-xs text-zinc-600 font-mono">Personal Instance</p>
          <p className="text-xs text-zinc-500 mt-0.5">Local · SQLite</p>
        </div>
      </div>
    </aside>
  );
}
