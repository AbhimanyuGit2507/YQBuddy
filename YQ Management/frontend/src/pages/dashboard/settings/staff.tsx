import React, { useState } from 'react';
import Head from 'next/head';
import AdminLayout from '../../../components/AdminLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../../lib/api';
import { Plus, Trash2, Mail, Shield, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../../components/AuthContext';
import { useRouter } from 'next/router';

export default function StaffDirectory() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('AGENT');
  
  // Basic RBAC check on client side to prevent rendering for non-admins
  React.useEffect(() => {
    if (user && user.role !== 'TENANT_ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: () => fetchApi('/users'),
    enabled: user?.role === 'TENANT_ADMIN'
  });

  const createStaff = useMutation({
    mutationFn: (data: { email: string, role: string }) => fetchApi('/users', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setEmail('');
      setRole('AGENT');
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

  if (!user || user.role !== 'TENANT_ADMIN') return null;

  return (
    <AdminLayout>
      <Head>
        <title>Staff Directory | QMover</title>
      </Head>

      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Directory</h1>
          <p className="text-gray-500 dark:text-zinc-400 mt-2">Manage roles and permissions for your team.</p>
        </div>

        <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
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
                <option value="AGENT">Agent</option>
                <option value="MANAGER">Manager</option>
                <option value="TENANT_ADMIN">Admin</option>
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
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 text-sm font-medium text-gray-500 dark:text-zinc-400">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-white/10">
              {isLoading ? (
                <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
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
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border-gray-200 dark:border-white/10">
                      <Shield className="w-3.5 h-3.5" /> {s.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => {
                        if (confirm('Are you sure you want to remove this user?')) {
                          deleteStaff.mutate(s.id);
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      disabled={s.id === user.id} // prevent self deletion
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {staff.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">No staff found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </AdminLayout>
  );
}
