import React, { useState } from 'react';
import Head from 'next/head';
import SettingsLayout from '../../../components/SettingsLayout';

// ... (other imports remain, but we replace AdminLayout usage)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../../lib/api';
import { Plus, Trash2, Mail, Shield, User as UserIcon, Loader2, MailCheck, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../../components/AuthContext';
import { useRouter } from 'next/router';
import { toast } from 'sonner';

type StaffMember = {
  id: string;
  email: string;
  role: string;
};

export default function StaffDirectory() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('OPERATOR');
  const [inviteMessage, setInviteMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  React.useEffect(() => {
    if (user && user.role !== 'TENANT_ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const { data: staff = [], isLoading, isError } = useQuery<StaffMember[]>({
    queryKey: ['staff'],
    queryFn: () => fetchApi('/users'),
    enabled: user?.role === 'TENANT_ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN',
    staleTime: 30000,
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
      setInviteMessage({ type: 'success', text: 'Staff member invited successfully' });
      setTimeout(() => setInviteMessage(null), 3000);
    },
    onError: (e: Error) => {
      setInviteMessage({ type: 'error', text: e?.message || 'Error inviting staff' });
      setTimeout(() => setInviteMessage(null), 5000);
    }
  });

  const deleteStaff = useMutation({
    mutationFn: (id: string) => fetchApi(`/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    createStaff.mutate({ email, role });
  };

  const handleDelete = (id: string, email: string) => {
    if (id === user?.userId) {
      toast.warning('You cannot remove yourself from the staff list.');
      return;
    }
    if (!confirm(`Are you sure you want to remove ${email} from staff?`)) return;
    deleteStaff.mutate(id);
  };

  const currentUserEmail = user?.email || '';
  const currentUserId = user?.userId || '';

  // The current admin is always guaranteed to appear in the staff list,
  // even if the API returns empty (e.g. edge case where the admin is the
  // only member of the workspace or the request fails).
  const displayStaff: StaffMember[] = React.useMemo(() => {
    const list = Array.isArray(staff) ? [...staff] : [];
    const existingIndex = list.findIndex((s) => s.email === currentUserEmail);
    if (existingIndex >= 0) {
      list[existingIndex] = {
        id: list[existingIndex].id || currentUserId,
        email: currentUserEmail,
        role: list[existingIndex].role || user?.role || '',
      };
    } else {
      list.unshift({
        id: currentUserId,
        email: currentUserEmail,
        role: user?.role || '',
      });
    }
    return list;
  }, [staff, currentUserEmail, currentUserId, user?.role]);

  const adminCount = displayStaff.filter((s) => s.role === 'TENANT_ADMIN').length;
  const isLastAdmin = adminCount <= 1;

  if (!user || (user.role !== 'TENANT_ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) return null;

  return (
    <SettingsLayout pageTitle="Staff Directory" pageSubtitle="Manage roles and permissions for your team">
      <Head>
        <title>Staff Directory | QMover</title>
      </Head>

      <div className="max-w-4xl space-y-8 pb-12">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Directory</h1>
          <p className="text-gray-500 dark:text-zinc-400 mt-2">Manage roles and permissions for your team. At least one admin is required.</p>
        </div>

        {inviteMessage && (
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${inviteMessage.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400'}`}>
            {inviteMessage.type === 'success' ? <MailCheck className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />}
            <div><h3 className="font-bold">{inviteMessage.type === 'success' ? 'Success' : 'Error'}</h3><p className="text-sm opacity-90">{inviteMessage.text}</p></div>
          </div>
        )}

        <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Invite New Staff</h2>
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
                <option value="MANAGER">Manager</option>
                <option value="TENANT_ADMIN">Admin</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={createStaff.isPending}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-600 text-white rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 h-[46px]"
            >
              {createStaff.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              {createStaff.isPending ? 'Inviting...' : 'Invite'}
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 text-sm font-medium text-gray-500 dark:text-zinc-400">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-white/5">
              {isLoading ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
              ) : isError ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Could not load staff list. Showing your account.</td>
                </tr>
              ) : displayStaff.map((s: StaffMember) => {
                const isCurrentUser = s.email === currentUserEmail;
                const isAdmin = s.role === 'TENANT_ADMIN';
                const canRemove = !isCurrentUser && !(isAdmin && isLastAdmin);

                return (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{s.email}</p>
                          {isCurrentUser && <p className="text-xs text-indigo-600 dark:text-indigo-400">You</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border-gray-200 dark:border-white/10">
                        <Shield className="w-3.5 h-3.5" /> {s.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {isCurrentUser ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                          <MailCheck className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-50 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-white/10">
                          <Mail className="w-3 h-3" /> Invited
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(s.id, s.email)}
                        disabled={!canRemove}
                        className={`p-2 rounded-lg transition-colors ${!canRemove
                            ? 'text-gray-300 dark:text-zinc-600 cursor-not-allowed'
                            : 'text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10'
                          }`}
                        title={!canRemove ? (isCurrentUser ? 'Cannot remove yourself' : 'At least one admin is required') : 'Remove staff member'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {displayStaff.length === 1 && !isLoading && !isError && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Only you are in this workspace. Invite team members to get started.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </SettingsLayout>
  );
}