import React from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/AdminLayout';
import { Monitor, QrCode } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../../lib/api';

export default function DisplayPicker() {
  const { data: queues = [], isLoading } = useQuery({
    queryKey: ['queues'],
    queryFn: () => fetchApi('/queue'),
  });

  return (
    <AdminLayout pageTitle="QR Display" pageSubtitle="Manage your QR code displays">
      <Head>
        <title>QR Display Picker | QMover</title>
      </Head>

      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex items-end justify-between border-b border-white/10 pb-6">
          <div>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium tracking-wider uppercase mb-1">TV Display</p>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Monitor className="w-8 h-8 text-indigo-400" />
              QR Display Mode
            </h1>
          </div>
        </div>

        <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-2xl p-8">
          <p className="text-gray-600 dark:text-zinc-400 mb-8">
            Select a queue below to open its dedicated TV display mode in a new tab. You can cast this tab to a TV or monitor in your waiting area.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full p-8 text-center text-gray-500 dark:text-zinc-500">Loading queues...</div>
            ) : queues.length === 0 ? (
              <div className="col-span-full p-8 text-center text-gray-500 dark:text-zinc-500">No queues available. Please create a queue first.</div>
            ) : (
              queues.map((queue: any) => (
                <div key={queue.id} className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl p-6 hover:border-indigo-500/50 transition-colors shadow-sm dark:shadow-none">
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{queue.name}</h3>
                    <div className={`px-2 py-0.5 rounded border text-[10px] font-bold tracking-wider uppercase ${queue.status === 'ACTIVE' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400'}`}>
                      {queue.status === 'ACTIVE' ? 'Running' : queue.status}
                    </div>
                  </div>
                  
                  <Link 
                    href={`/dashboard/queues/${queue.id}/display`}
                    target="_blank"
                    className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition-colors shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                  >
                    <QrCode className="w-5 h-5" />
                    Open Display
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
