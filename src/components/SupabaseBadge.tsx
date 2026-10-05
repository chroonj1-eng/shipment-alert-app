import React, { useState } from 'react';
import { Database, CheckCircle2, Copy, Check, FileCode, X, ExternalLink } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';

export const SupabaseBadge: React.FC = () => {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopySql = async () => {
    try {
      const res = await fetch('/supabase/schema.sql');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono border transition-all cursor-pointer ${
          isSupabaseConfigured
            ? isDark
              ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : isDark
            ? 'bg-slate-800/90 border-slate-700 text-cyan-300 hover:border-cyan-500'
            : 'bg-slate-100 border-slate-300 text-slate-700 hover:border-slate-400'
        }`}
        title="View Supabase PostgreSQL Database & Schema"
      >
        <Database className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <span className="hidden sm:inline">
          {isSupabaseConfigured ? 'Supabase Connected' : 'Supabase Ready'}
        </span>
        <span className="inline sm:hidden">DB</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div
            className={`w-full max-w-2xl rounded-2xl border p-6 shadow-2xl transition-all ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight">Supabase PostgreSQL Database</h3>
                  <p className="text-xs text-slate-400">
                    Tables: profiles, jobs, job_assignments, shipments, notifications with Row Level Security (RLS)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div
                className={`p-3 rounded-xl border ${
                  isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Database Architecture Status
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 font-bold">
                    {isSupabaseConfigured ? 'LIVE CLOUD' : 'ZERO-CONFIG READY'}
                  </span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  The application is fully architected around Supabase PostgreSQL with strict Row Level Security (RLS).
                  SRMs only see their assigned jobs & shipments, while Admins have full access to User Management and Job Assignments.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-cyan-400" />
                    SQL Schema Migration (`supabase/schema.sql`)
                  </span>
                  <button
                    onClick={handleCopySql}
                    className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:underline cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied SQL!' : 'Copy SQL'}
                  </button>
                </div>
                <div className="font-mono text-[11px] p-3 rounded-lg bg-slate-950 text-slate-300 border border-slate-800 overflow-x-auto max-h-40">
                  <pre>{`-- Tables: profiles, jobs, job_assignments, shipments, notifications
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  employee_id TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'SRM',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  last_login TIMESTAMPTZ,
  ...
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;`}</pre>
                </div>
              </div>

              <div
                className={`p-3 rounded-xl border text-[11px] ${
                  isDark ? 'bg-cyan-950/30 border-cyan-800/40 text-cyan-200' : 'bg-cyan-50 border-cyan-200 text-cyan-900'
                }`}
              >
                <span className="font-bold">Live Supabase Connection:</span>
                <p className="mt-1 text-slate-400">
                  To connect your remote Supabase project, provide <code>VITE_SUPABASE_URL</code> and{' '}
                  <code>VITE_SUPABASE_ANON_KEY</code> in <code>.env</code> and run <code>supabase/schema.sql</code> in the Supabase SQL editor.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs cursor-pointer shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
