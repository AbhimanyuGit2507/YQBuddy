import React, { useState } from 'react';
import Head from 'next/head';
import AdminLayout from '../../../components/AdminLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../../lib/api';
import { Plus, Trash2, Mail, Shield, UserIcon, Loader2, CheckCircle2, UserMinus, UserCog, ArrowRightLeft } from 'lucide-react';
import { useAuth } from '../../../components/AuthContext';
import { useRouter } from 'next/router';

export default function StaffDirectory() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('OPERATOR');
  const [activeTab, setActiveTab] = useState<'members' | 'invitations'>('members');
  
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

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    createStaff.mutate({ email, role });
  };

  if (!user || user.role !== 'ADMIN') {
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
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Invite New Team Member</h2>
          <form onSubmit={handleCreate} className="flex items-end gap-4">
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
                        <span className={`text-xs font-medium px-2 py-1 rounded ${inv.revoked ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {inv.revoked ? 'Revoked' : 'Active'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
