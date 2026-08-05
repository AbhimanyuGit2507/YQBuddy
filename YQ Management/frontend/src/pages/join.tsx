import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../components/AuthContext';
import { fetchApi } from '../lib/api';
import { Building2, Users, Loader2, ArrowRight, Check, AlertCircle, Mail, MessageSquare } from 'lucide-react';
import { useShareInvite } from '../hooks/useShareInvite';

type JoinStatus = 'loading' | 'ready' | 'joining' | 'success' | 'error';

export default function JoinPage() {
  const router = useRouter();
  const { user, loading: authLoading, refetch } = useAuth();
  const [status, setStatus] = useState<JoinStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string>('');
  const [inviteCode, setInviteCode] = useState<string>('');

  useEffect(() => {
    const code = (router.query.code || router.query.inviteCode) as string;
    if (code) {
      const trimmed = code.trim().toUpperCase();
      setInviteCode(trimmed);
      localStorage.setItem('qmova_invite_code', trimmed);
      document.cookie = `qmova_invite_code=${trimmed}; path=/; max-age=86400; SameSite=Lax`;
    }
  }, [router.query]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setStatus('ready');
      return;
    }

    if (user.workspaceId && !inviteCode) {
      router.replace('/dashboard');
      return;
    }

    if (inviteCode) {
      handleJoin();
    } else {
      setStatus('ready');
    }
  }, [user, authLoading, inviteCode]);

  const handleJoin = async () => {
    if (!inviteCode) return;
    setStatus('joining');
    setError(null);

    try {
      const res = await fetchApi('/workspace/join', {
        method: 'POST',
        body: JSON.stringify({ code: inviteCode }),
      });
      setWorkspaceName(res.workspace?.name || 'the workspace');
      setStatus('success');
      localStorage.removeItem('qmova_invite_code');
      document.cookie = 'qmova_invite_code=; path=/; max-age=0; SameSite=Lax';
      await refetch();
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Invalid or expired invitation code');
    }
  };

  if (status === 'loading' || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Welcome to {workspaceName}!</h1>
          <p className="text-zinc-400">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <Head><title>Join Workspace | Qmova</title></Head>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2.5 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-lg shadow-[0_0_25px_rgba(99,102,241,0.5)] tracking-tighter">
                Q
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-white">Qmova</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">Join Workspace</h1>
            <p className="text-zinc-400">Sign in or create an account to join</p>
          </div>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
            <p className="text-sm text-zinc-400 mb-4">You need an account to join this workspace.</p>
            <div className="space-y-3">
              <button onClick={() => router.push(`/login?inviteCode=${inviteCode}`)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors">
                Sign In
              </button>
              <button onClick={() => router.push(`/register?inviteCode=${inviteCode}`)} className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-colors">
                Create Account
              </button>
            </div>
            {inviteCode && (
              <div className="mt-4 p-3 bg-black/30 rounded-xl">
                <p className="text-xs text-zinc-500">Invitation Code</p>
                <p className="font-mono font-bold text-indigo-400">{inviteCode}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <Head><title>Join Workspace | Qmova</title></Head>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-lg shadow-[0_0_25px_rgba(99,102,241,0.5)] tracking-tighter">
              Q
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">Qmova</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Join Workspace</h1>
          <p className="text-zinc-400">Enter the invitation code to join</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm">{error}</p>
              <button 
                onClick={handleJoin}
                disabled={status === 'joining'}
                className="mt-3 text-sm font-medium underline hover:text-red-300 transition-colors disabled:opacity-50"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
          <form onSubmit={(e) => { e.preventDefault(); handleJoin(); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Invitation Code</label>
              <input
                type="text"
                required
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono tracking-wider"
                placeholder="ABC123XY"
                maxLength={12}
              />
            </div>
            <button
              type="submit"
              disabled={status === 'joining' || !inviteCode}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {status === 'joining' && <Loader2 className="w-5 h-5 animate-spin" />}
              {status === 'joining' ? 'Joining...' : 'Join Workspace'}
              {status !== 'joining' && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}