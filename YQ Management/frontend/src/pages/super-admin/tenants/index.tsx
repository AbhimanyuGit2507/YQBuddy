import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import SuperAdminLayout from '../../../components/SuperAdminLayout';
import { fetchApi } from '../../../lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, MoreVertical, Search, Users, QrCode, ArrowUpRight, Trash2, CreditCard } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export default function SuperAdminTenants() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [showActions, setShowActions] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['super-admin-tenants', search],
    queryFn: () => fetchApi(`/super-admin/tenants?search=${encodeURIComponent(search)}`),
  });

  const deleteTenantMutation = useMutation({
    mutationFn: (id: string) => fetchApi(`/super-admin/tenants/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-tenants'] });
      toast.success('Tenant removed');
    },
    onError: () => toast.error('Failed to remove tenant'),
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this tenant? This action cannot be undone.')) {
      deleteTenantMutation.mutate(id);
    }
  };

  return (
    <SuperAdminLayout pageTitle="Businesses" pageSubtitle="Manage all tenants and subscriptions">
      <Head>
        <title>Businesses | Super Admin</title>
      </Head>

      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white uppercase">Businesses</h1>
            <p className="text-gray-500 dark:text-zinc-400 mt-2">Manage all tenants and subscriptions on the platform.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search businesses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-64 pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-zinc-400">
              <thead className="bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-zinc-200 font-bold uppercase tracking-wider text-xs border-b border-gray-200 dark:border-white/10">
                <tr>
                  <th className="px-6 py-4">Business</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Subscription</th>
                  <th className="px-6 py-4">Users</th>
                  <th className="px-6 py-4">Queues</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400 dark:text-zinc-500">Loading businesses...</td>
                  </tr>
                ) : tenants?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400 dark:text-zinc-500">No businesses found.</td>
                  </tr>
                ) : (
                  tenants?.map((tenant: any) => (
                    <tr key={tenant.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-gray-900 dark:text-white">{tenant.name}</div>
                        <div className="text-xs text-gray-400 dark:text-zinc-500 mt-1 font-mono truncate max-w-[200px]">{tenant.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400">Active</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          tenant.subscriptionStatus === 'ACTIVE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400' :
                          tenant.subscriptionStatus === 'TRIAL' ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400' :
                          'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400'
                        }`}>{tenant.subscriptionStatus}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white font-medium">{tenant._count?.users || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white font-medium">{tenant._count?.queues || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-zinc-400">{tenant.createdAt ? formatDistanceToNow(new Date(tenant.createdAt), { addSuffix: true }) : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right relative">
                        <div className="relative inline-block">
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowActions(showActions === tenant.id ? null : tenant.id); }}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-400 dark:text-zinc-500 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {showActions === tenant.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-white/10 shadow-xl py-1 z-50">
                              <Link href={`/super-admin/tenants/${tenant.id}`} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-white/5" onClick={() => setShowActions(null)}>
                                <ArrowUpRight className="w-4 h-4" /> View Details
                              </Link>
                              <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-white/5 w-full text-left" onClick={() => { router.push('/super-admin/plans'); setShowActions(null); }}>
                                <CreditCard className="w-4 h-4" /> Assign Plan
                              </button>
                              <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-white/5 w-full text-left" onClick={() => { toast.info('Workspace management coming soon'); setShowActions(null); }}>
                                <QrCode className="w-4 h-4" /> Manage Workspace
                              </button>
                              <hr className="my-1 border-gray-100 dark:border-white/5" />
                              <button className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 w-full text-left" onClick={() => { handleDelete(tenant.id); setShowActions(null); }}>
                                <Trash2 className="w-4 h-4" /> Remove
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
