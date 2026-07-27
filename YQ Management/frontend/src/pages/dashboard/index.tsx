import React from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/AdminLayout';
import { Users, Clock, LayoutGrid, AlertTriangle, ScanLine, Printer, Settings } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../../lib/api';

export default function Dashboard() {
  const { data: queues = [], isLoading } = useQuery({
    queryKey: ['queues'],
    queryFn: () => fetchApi('/queue'),
  });

  const totalWaiting = queues.reduce((acc: number, q: any) => acc + (q._count?.tokens || 0), 0);
  const activeQueues = queues.filter((q: any) => q.status === 'ACTIVE').length;
  const avgWaitTime = totalWaiting === 0 ? 0 : Math.ceil((totalWaiting * 5) / (activeQueues || 1));

  return (
    <AdminLayout>
      <Head>
        <title>Dashboard | QMover</title>
      </Head>

      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Overview</h1>
            <p className="text-gray-500 dark:text-zinc-400">Here is what is happening in your queues right now.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors shadow-[0_0_15px_rgba(79,70,229,0.3)] border border-indigo-500/50">
              <ScanLine className="w-4 h-4" />
              Open Scanner
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-lg font-medium transition-colors border border-gray-200 dark:border-white/10 shadow-sm">
              <Printer className="w-4 h-4" />
              Print QRs
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-lg font-medium transition-colors border border-gray-200 dark:border-white/10 shadow-sm">
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-6">
          
          <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-sm dark:shadow-none">
            <div className="absolute top-0 right-0 p-6">
              <Users className="w-5 h-5 text-gray-400 dark:text-zinc-600" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">Total Waiting</p>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">{isLoading ? '-' : totalWaiting}</span>
              <span className="text-sm text-gray-500 dark:text-zinc-500">people</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></div>
              Live
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-sm dark:shadow-none">
            <div className="absolute top-0 right-0 p-6">
              <Clock className="w-5 h-5 text-gray-400 dark:text-zinc-600" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">Avg Wait Time</p>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">~{isLoading ? '-' : avgWaitTime}</span>
              <span className="text-sm text-gray-500 dark:text-zinc-500">mins</span>
            </div>
            <div className="h-1 w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden mt-4">
              <div className="h-full bg-indigo-500 w-1/4 rounded-full"></div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-sm dark:shadow-none">
            <div className="absolute top-0 right-0 p-6">
              <LayoutGrid className="w-5 h-5 text-gray-400 dark:text-zinc-600" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">Active Queues</p>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">{isLoading ? '-' : activeQueues}</span>
              <span className="text-sm text-gray-500 dark:text-zinc-500">/ {queues.length}</span>
            </div>
            <p className="text-xs text-gray-400 dark:text-zinc-400 mt-5">All running smoothly</p>
          </div>

          <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-sm dark:shadow-none">
            <div className="absolute top-0 right-0 p-6">
              <AlertTriangle className="w-5 h-5 text-gray-400 dark:text-zinc-600" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">System Alerts</p>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">0</span>
              <span className="text-sm text-gray-500 dark:text-zinc-500">issues</span>
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-5 font-medium">No issues detected</p>
          </div>

        </div>

        {/* Live Queues Section */}
        <div className="pt-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Live Queues</h2>
            <Link id="tour-create-queue-btn" href="/dashboard/queues" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-medium flex items-center gap-1">
              Manage all &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-6">
            
            {queues.map((queue: any) => (
              <div key={queue.id} className="bg-white dark:bg-zinc-900/50 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-2xl p-6 hover:border-indigo-500/30 transition-colors group shadow-sm dark:shadow-none">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{queue.name}</h3>
                    <div className="flex items-center text-xs text-gray-500 dark:text-zinc-400 gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {queue.status}
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded border text-[10px] font-bold tracking-wider uppercase ${queue.status === 'ACTIVE' ? 'bg-emerald-100 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' : 'bg-yellow-100 border-yellow-200 text-yellow-700 dark:bg-yellow-500/10 dark:border-yellow-500/20 dark:text-yellow-400'}`}>
                    {queue.status === 'ACTIVE' ? 'Running' : queue.status}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6 p-4 rounded-xl bg-gray-50 dark:bg-black/40 border border-gray-100 dark:border-white/5">
                  <div className="text-center border-r border-gray-200 dark:border-white/5">
                    <p className="text-[10px] text-gray-500 dark:text-zinc-500 uppercase font-medium mb-1">Waiting</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{queue._count?.tokens || 0}</p>
                  </div>
                  <div className="text-center border-r border-gray-200 dark:border-white/5">
                    <p className="text-[10px] text-gray-500 dark:text-zinc-500 uppercase font-medium mb-1">Serving</p>
                    <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">--</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500 dark:text-zinc-500 uppercase font-medium mb-1">Avg Wait</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">~{queue._count?.tokens > 0 ? queue._count.tokens * 5 : 0}m</p>
                  </div>
                </div>

                <Link href={`/dashboard/queues/${queue.id}`} className="w-full block text-center py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors">
                  Manage Workspace
                </Link>
              </div>
            ))}

            {queues.length === 0 && !isLoading && (
              <div className="col-span-3 text-center py-12 text-gray-500 dark:text-zinc-500">
                No queues created yet. <Link href="/dashboard/queues" className="text-indigo-600 dark:text-indigo-400 hover:underline">Create one</Link>.
              </div>
            )}

          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
