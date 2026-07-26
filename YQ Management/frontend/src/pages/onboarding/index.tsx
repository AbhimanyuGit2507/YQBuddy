import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../components/AuthContext';
import { fetchApi } from '../../lib/api';
import { Building2, Users, Loader2, ArrowRight, Check, AlertCircle } from 'lucide-react';

type OnboardingMode = 'select' | 'create' | 'join';

export default function Onboarding() {
  const router = useRouter();
  const { user, loading: authLoading, refetch } = useAuth();
  const [mode, setMode] = useState<OnboardingMode>('select');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [workspaceName, setWorkspaceName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => {
    if (!authLoading && user && user.workspaceId) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await fetchApi('/auth/workspace', {
        method: 'POST',
        body: JSON.stringify({ name: workspaceName, subdomain }),
      });
      await refetch();
      setSuccess('Workspace created successfully! Redirecting...');
      setTimeout(() => router.push('/dashboard'), 800);
    } catch (err: any) {
      setError(err.message || 'Failed to create workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await fetchApi('/auth/join', {
        method: 'POST',
        body: JSON.stringify({ code: inviteCode }),
      });
      await refetch();
      setSuccess('Joined workspace successfully! Redirecting...');
      setTimeout(() => router.push('/dashboard'), 800);
    } catch (err: any) {
      setError(err.message || 'Invalid invitation code');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (user && user.workspaceId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <Head>
        <title>Get Started | QMover</title>
      </Head>

      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xl shadow-[0_0_25px_rgba(99,102,241,0.5)] mx-auto mb-6">
            YQ
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome to QMover</h1>
          <p className="text-zinc-400">Choose how you want to get started</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-start gap-3">
            <Check className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{success}</p>
          </div>
        )}

        {mode === 'select' && (
          <div className="grid grid-cols-2 gap-6 animate-in fade-in duration-500">
            <button
              onClick={() => setMode('create')}
              className="p-8 rounded-2xl bg-zinc-900 border border-white/10 hover:border-indigo-500/50 hover:bg-zinc-800 transition-all text-left group"
            >
              <div className="w-14 h-14 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:bg-indigo-500/20 transition-colors">
                <Building2 className="w-7 h-7 text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Create Workspace</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Start fresh with your own workspace. You will become the admin and can invite team members.
              </p>
              <div className="mt-6 flex items-center gap-2 text-indigo-400 text-sm font-medium">
                Get started <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            <button
              onClick={() => setMode('join')}
              className="p-8 rounded-2xl bg-zinc-900 border border-white/10 hover:border-purple-500/50 hover:bg-zinc-800 transition-all text-left group"
            >
              <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-colors">
                <Users className="w-7 h-7 text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Join Workspace</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Already have an invitation? Enter your code to join an existing team workspace.
              </p>
              <div className="mt-6 flex items-center gap-2 text-purple-400 text-sm font-medium">
                Join team <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="bg-zinc-900 rounded-2xl border border-white/10 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => { setMode('select'); setError(null); setSuccess(null); }}
                className="text-zinc-400 hover:text-white text-sm transition-colors"
              >
                ← Back
              </button>
              <h2 className="text-xl font-bold text-white">Create Your Workspace</h2>
            </div>

            <form onSubmit={handleCreateWorkspace} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Workspace Name</label>
                <input
                  type="text"
                  required
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="e.g., Acme Clinic"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Subdomain</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="flex-1 bg-black border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="my-company"
                  />
                  <span className="text-zinc-500 text-sm whitespace-nowrap">.qmover.app</span>
                </div>
                <p className="text-xs text-zinc-500 mt-2">This will be used for your public queue pages.</p>
              </div>

              <button
                type="submit"
                disabled={loading || !workspaceName || !subdomain}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {loading ? 'Creating Workspace...' : 'Create Workspace'}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>
            </form>
          </div>
        )}

        {mode === 'join' && (
          <div className="bg-zinc-900 rounded-2xl border border-white/10 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => { setMode('select'); setError(null); setSuccess(null); }}
                className="text-zinc-400 hover:text-white text-sm transition-colors"
              >
                ← Back
              </button>
              <h2 className="text-xl font-bold text-white">Join Workspace</h2>
            </div>

            <form onSubmit={handleJoinWorkspace} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Invitation Code</label>
                <input
                  type="text"
                  required
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-purple-500 transition-colors font-mono tracking-wider"
                  placeholder="ABC123XY"
                  maxLength={12}
                />
                <p className="text-xs text-zinc-500 mt-2">Enter the 8-character code shared by your workspace admin.</p>
              </div>

              <button
                type="submit"
                disabled={loading || inviteCode.length < 6}
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {loading ? 'Joining...' : 'Join Workspace'}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
