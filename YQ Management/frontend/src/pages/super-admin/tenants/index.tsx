import React from 'react';
import Head from 'next/head';
import SuperAdminLayout from '../../../components/SuperAdminLayout';
import { fetchApi } from '../../../lib/api';
import { useQuery } from '@tanstack/react-query';
import { Shield, MoreVertical, Search, Lock, Unlock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function SuperAdminTenants() {
  const { data: tenants, isLoading } = useQuery({
    queryKey: ['super-admin-tenants'],
    queryFn: () => fetchApi('/super-admin/tenants')
  });

  return (
    <SuperAdminLayout>
      <Head>
        <title>Business Management | Super Admin</title>
      </Head>

      <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white uppercase">Businesses</h1>
            <p className="text-gray-500 dark:text-rose-200/60 mt-2">Manage all tenants and subscriptions on the platform.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-rose-900/50" />
            <input 
              type="text" 
              placeholder="Search businesses..." 
              className="w-full md:w-64 pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-rose-900/30 bg-white dark:bg-[#120005] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-[#120005] border border-gray-200 dark:border-rose-900/30 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-zinc-400">
              <thead className="bg-gray-50 dark:bg-rose-950/20 text-gray-900 dark:text-rose-100 font-bold uppercase tracking-wider text-xs border-b border-gray-200 dark:border-rose-900/30">
                <tr>
                  <th className="px-6 py-4">Tenant Name</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Subscription</th>
                  <th className="px-6 py-4">Users</th>
                  <th className="px-6 py-4">Queues</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-rose-900/20">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-rose-900/50">
                      Loading businesses...
                    </td>
                  </tr>
                ) : tenants?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-rose-900/50">
                      No businesses found.
                    </td>
                  </tr>
                ) : (
                  tenants?.map((tenant: any) => (
                    <tr key={tenant.id} className="hover:bg-gray-50 dark:hover:bg-rose-950/10 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-gray-900 dark:text-white">{tenant.name}</div>
                        <div className="text-xs text-gray-500 dark:text-rose-200/50 mt-1 truncate max-w-[200px]">{tenant.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          tenant.subscriptionStatus === 'ACTIVE' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400'
                            : tenant.subscriptionStatus === 'TRIAL'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400'
                        }`}>
                          {tenant.subscriptionStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white font-medium">
                        {tenant._count?.users || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white font-medium">
                        {tenant._count?.queues || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatDistanceToNow(new Date(tenant.createdAt), { addSuffix: true })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button className="p-2 hover:bg-gray-200 dark:hover:bg-rose-900/30 rounded-lg text-gray-400 dark:text-rose-500 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
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
