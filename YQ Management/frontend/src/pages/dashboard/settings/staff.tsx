import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '../../../components/AdminLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../../lib/api';
import { Plus, Trash2, Mail, Shield, UserIcon, Loader2, CheckCircle2, UserMinus, UserCog, ArrowRightLeft, ChevronDown, Copy, MessageSquare, Share2, Link, Users } from 'lucide-react';
import { useAuth } from '../../../components/AuthContext';
import { useRouter } from 'next/router';
import { useShareInvite } from '../../../hooks/useShareInvite';

type ActionMode = 'invite' | 'join';

export default function StaffDirectory() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [actionMode, setActionMode] = useState<ActionMode>('invite');
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('OPERATOR');
  const [joinCode, setJoinCode] = useState('');
  const [activeTab, setActiveTab] = useState<'members' | 'invitations'>('members');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<any>(null);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinStatus, setJoinStatus] = useState<'form' | 'success' | 'error'>('form');
  const [joinError, setJoinError] = useState('');

  const { data: staff = [], isLoading: staffLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: () => fetchApi('/users'),
  });

  const { data: invitations = [], isLoading: invLoading } = useQuery({
    queryKey: ['invitations'],
    queryFn: () => fetchApi('/invitations'),
    enabled: activeTab === 'invitations',
  });

  const createStaff = useMutation({
    mutationFn: (data: { email: string, role: string }) => fetchApi('/users', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setEmail('');
      setRole('OPERATOR');
      setShowModal(false);
    },
  });

  const createJoinCode = useMutation({
    mutationFn: (role: string) => fetchApi('/invitations/join-code', {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      setShowModal(false);
      setActiveTab('invitations');
    },
  });

  const deleteStaff = useMutation({
    mutationFn: (id: string) => fetchApi(`/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => fetchApi(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });

  const toggleStatus = useMutation({
    mutationFn: (id: string) => fetchApi(`/users/${id}/status`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });

  const transferOwnership = useMutation({
    mutationFn: (newAdminId: string) => fetchApi('/users/transfer-ownership', {
      method: 'POST',
      body: JSON.stringify({ newAdminId }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      router.push('/dashboard');
    },
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    createStaff.mutate({ email, role });
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode) return;
    setJoinStatus('form');
    setJoinError('');
    fetchApi('/workspace/join', {
      method: 'POST',
      body: JSON.stringify({ code: joinCode }),
    })
      .then(() => {
        setJoinStatus('success');
        setTimeout(() => {
          setJoinModalOpen(false);
          setJoinCode('');
          setJoinStatus('form');
          window.location.href = '/dashboard';
        }, 1500);
      })
      .catch((err: any) => {
        setJoinStatus('error');
        setJoinError(err.message || 'Invalid join code');
      });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const openShareModal = (invitation: any) => {
    setSelectedInvitation(invitation);
    setShareModalOpen(true);
  };

  const { shareViaEmail, shareViaWhatsApp } = useShareInvite(
    selectedInvitation?.code || '',
    selectedInvitation?.workspace?.name,
  );

  useEffect(() => {
    if (!user || !user.email) return;
    const hasWorkspace = user.workspaceId;
    if (!hasWorkspace) {
      const timer = setTimeout(() => {
        setJoinModalOpen(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  if (!user || user.email !== 'yqbuddysa@gmail.com') {
    return (
      <AdminLayout>
        <div className="p-12 text-center text-zinc-400">You do not have permission to view this page.</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>User Management | QMover</title>
      </Head>

      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-500 dark:text-zinc-400 mt-2">Manage roles, permissions, and team members for your workspace.</p>
        </div>

        <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {actionMode === 'invite' ? 'Invite New Team Member' : 'Join Another Workspace'}
            </h2>
            <div className="relative">
              <button
                onClick={() => setShowModal(!showModal)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 h-[46px]"
              >
                {actionMode === 'invite' ? <><Plus className="w-5 h-5" /> Invite</> : <><Users className="w-5 h-5" /> Join</>}
                <ChevronDown className="w-4 h-4" />
              </button>
              {showModal && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                  <button
                    onClick={() => { setActionMode('invite'); setShowModal(false); }}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors ${actionMode === 'invite' ? 'text-indigo-600 font-medium' : 'text-gray-700 dark:text-zinc-200'}`}
                  >
                    Invite to workspace
                  </button>
                  <button
                    onClick={() => { setActionMode('join'); setShowModal(false); }}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors ${actionMode === 'join' ? 'text-indigo-600 font-medium' : 'text-gray-700 dark:text-zinc-200'}`}
                  >
                    Join workspace
                  </button>
                </div>
              )}
            </div>
          </div>

          {actionMode === 'invite' && (
            <form onSubmit={handleInvite} className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-400 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 bg-white dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="colleague@example.com"
                  />
                </div>
              </div>
              <div className="w-48">
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-400 mb-2">Role</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full bg-white dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                >
                  <option value="OPERATOR">Operator</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={createStaff.isPending}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 h-[46px]"
              >
                <Plus className="w-5 h-5" /> Invite
              </button>
            </form>
          )}

          {actionMode === 'join' && (
            <form onSubmit={handleJoinSubmit} className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-400 mb-2">Workspace Join Code</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value.toUpperCase())}
                    className="w-full pl-10 bg-white dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                    placeholder="Enter join code (e.g. ABC12345)"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={!joinCode}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 h-[46px]"
              >
                Join Workspace
              </button>
            </form>
          )}
        </div>

        <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-white/10">
            <button
              onClick={() => setActiveTab('members')}
              className={`px-6 py-3 text-sm font-bold transition-colors ${activeTab === 'members' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-900 dark:text-zinc-500'}`}
            >
              Team Members
            </button>
            <button
              onClick={() => setActiveTab('invitations')}
              className={`px-6 py-3 text-sm font-bold transition-colors ${activeTab === 'invitations' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-900 dark:text-zinc-500'}`}
            >
              Invitations
            </button>
          </div>

          {activeTab === 'members' && (
            <>
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 text-sm font-medium text-gray-500 dark:text-zinc-400">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                  {staffLoading ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
                  ) : staff.map((s: any) => (
                    <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                            <UserIcon className="w-4 h-4" />
                          </div>
                          <span className="text-gray-900 dark:text-white font-medium">{s.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {s.id === user.id ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border-gray-200 dark:border-white/10">
                            <Shield className="w-3.5 h-3.5" /> {s.role}
                          </span>
                        ) : (
                          <select
                            value={s.role}
                            onChange={(e) => updateRole.mutate({ id: s.id, role: e.target.value })}
                            className="bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1 text-xs font-medium text-gray-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="ADMIN">Admin</option>
                            <option value="OPERATOR">Operator</option>
                          </select>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${s.status === 'ACTIVE' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20'}`}>
                          {s.status === 'ACTIVE' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <UserMinus className="w-3.5 h-3.5" />}
                          {s.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {s.id !== user.id && (
                            <>
                              <button
                                onClick={() => {
                                  if (s.id === user.id) return;
                                  if (confirm(`Transfer ownership to ${s.email}? You will become an operator.`)) {
                                    transferOwnership.mutate(s.id);
                                  }
                                }}
                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
                                title="Transfer Ownership"
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => toggleStatus.mutate(s.id)}
                                className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-500/10 rounded-lg transition-colors"
                                title={s.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                              >
                                <UserCog className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Are you sure you want to remove this user?')) {
                                    deleteStaff.mutate(s.id);
                                  }
                                }}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                disabled={s.id === user.id}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {staff.length === 0 && !staffLoading && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No team members found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </>
          )}

          {activeTab === 'invitations' && (
            <>
              <div className="p-6">
                <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">Active invitations to your workspace.</p>
                {invLoading ? (
                  <div className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
                ) : invitations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No active invitations.</div>
                ) : (
                  <div className="space-y-3">
                    {invitations.map((inv: any) => (
                      <div key={inv.id} className="flex items-center justify-between bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/5 p-4 rounded-xl">
                        <div>
                          <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{inv.code}</p>
                          <p className="text-xs text-zinc-500 mt-1">{inv.role} · {inv.usedCount}/{inv.maxUses} used · Expires {new Date(inv.expiresAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => openShareModal(inv)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors" title="Share Invite">
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => copyToClipboard(inv.code)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors" title="Copy Code">
                            <Copy className="w-4 h-4" />
                          </button>
                          <span className={`text-xs font-medium px-2 py-1 rounded ${inv.revoked ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {inv.revoked ? 'Revoked' : 'Active'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {shareModalOpen && selectedInvitation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Share Invitation</h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">Send this invitation via email or WhatsApp.</p>
              <div className="flex gap-3 mb-4">
                <button onClick={shareViaEmail} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-700 dark:text-red-400 rounded-xl transition-colors">
                  <Mail className="w-5 h-5" /> Email
                </button>
                <button onClick={shareViaWhatsApp} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-50 hover:bg-green-100 dark:bg-green-500/10 dark:hover:bg-green-500/20 text-green-700 dark:text-green-400 rounded-xl transition-colors">
                  <MessageSquare className="w-5 h-5" /> WhatsApp
                </button>
              </div>
              <div className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl p-3 mb-4">
                <p className="text-xs text-zinc-500 mb-1">Join Code</p>
                <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{selectedInvitation.code}</p>
              </div>
              <button onClick={() => setShareModalOpen(false)} className="w-full py-2 text-sm text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white transition-colors">Close</button>
            </div>
          </div>
        )}

        {joinModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
              {joinStatus === 'success' ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Welcome!</h3>
                  <p className="text-gray-500 dark:text-zinc-400">You've successfully joined the workspace.</p>
                </div>
              ) : joinStatus === 'error' ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">😕</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">User Not Found</h3>
                  <p className="text-gray-500 dark:text-zinc-400 mb-4">The email <strong>{email}</strong> doesn't exist on QMover yet.</p>
                  <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">Invite them to create an account first, then they can join your workspace.</p>
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Send invite via</p>
                    <div className="flex gap-3">
                      <button onClick={shareViaEmail} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-700 dark:text-red-400 rounded-xl transition-colors">
                        <Mail className="w-5 h-5" /> Email
                      </button>
                      <button onClick={shareViaWhatsApp} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-50 hover:bg-green-100 dark:bg-green-500/10 dark:hover:bg-green-500/20 text-green-700 dark:text-green-400 rounded-xl transition-colors">
                        <MessageSquare className="w-5 h-5" /> WhatsApp
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Join Another Workspace</h3>
                  <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">Enter the join code provided by the workspace admin.</p>
                  <form onSubmit={handleJoinSubmit}>
                    <div className="relative mb-4">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={joinCode}
                        onChange={e => setJoinCode(e.target.value.toUpperCase())}
                        className="w-full pl-10 bg-white dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                        placeholder="Enter join code"
                        autoFocus
                      />
                    </div>
                    {joinError && <p className="text-sm text-red-500 mb-3">{joinError}</p>}
                    <div className="flex gap-3">
                      <button type="button" onClick={() => { setJoinModalOpen(false); setJoinCode(''); setJoinStatus('form'); setJoinError(''); }} className="flex-1 py-2.5 text-sm text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white transition-colors">Cancel</button>
                      <button type="submit" disabled={!joinCode} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50">Join</button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}