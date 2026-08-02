import React from 'react';
import Head from 'next/head';
import SuperAdminLayout from '../../../components/SuperAdminLayout';
import { fetchApi } from '../../../lib/api';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Users, Building2, Activity, Mail, MessageSquare, Clock, Target } from 'lucide-react';
import { format } from 'date-fns';

export default function SuperAdminAnalytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['super-admin-analytics'],
    queryFn: () => fetchApi('/super-admin/analytics'),
  });

  const metrics = data?.metrics || {};
  const trends = data?.trends || [];
  const topTenants = data?.topTenants || [];

  return (
    <SuperAdminLayout pageTitle="Analytics" pageSubtitle="Platform-wide insights and trends">
      <Head>
        <title>Analytics | Super Admin</title>
      </Head>

      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white uppercase">Analytics</h1>
          <p className="text-gray-500 dark:text-zinc-400 mt-2">Platform-wide performance insights</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Tenants', value: metrics.totalTenants || 0, icon: Building2, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
            { label: 'Total Users', value: metrics.totalUsers || 0, icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
            { label: 'Active Queues', value: metrics.activeQueues || 0, icon: Activity, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
            { label: 'Total Tokens', value: metrics.totalTokens || 0, icon: Target, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
          ].map((stat, i) => (
            <div key={i} className={`rounded-2xl border border-gray-200 dark:border-white/10 p-6 ${stat.bg}`}>
              <stat.icon className={`w-8 h-8 ${stat.color} mb-3`} />
              <p className="text-3xl font-black text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Growth Chart Placeholder */}
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Tenant Growth</h3>
          {trends.length > 0 ? (
            <div className="space-y-3">
              {trends.map((trend: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-white/5 last:border-0">
                  <span className="text-sm text-gray-600 dark:text-zinc-400">{trend.date ? format(new Date(trend.date), 'MMM d, yyyy') : '-'}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{trend.newTenants} new</span>
                    <span className="text-xs text-gray-400 dark:text-zinc-500">({trend.totalTenants} total)</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 dark:text-zinc-500">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No trend data available yet</p>
              </div>
            </div>
          )}
        </div>

        {/* Top Tenants */}
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Top Businesses by Queues</h3>
          {topTenants.length > 0 ? (
            <div className="space-y-3">
              {topTenants.map((tenant: any, i: number) => (
                <div key={tenant.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {i + 1}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">{tenant.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> {tenant.queueCount} queues</span>
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {tenant.userCount} users</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-zinc-500">No tenant data available</p>
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
}