import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import Head from 'next/head';
import AdminLayout from '../../../components/AdminLayout';
import { Plus, QrCode, X, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../../../lib/api';

export default function QueuesList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newQueueName, setNewQueueName] = useState('');
  const [includeName, setIncludeName] = useState(true);
  const [includePhone, setIncludePhone] = useState(true);
  const [includePurpose, setIncludePurpose] = useState(true);

  const { data: queues = [], isLoading, refetch } = useQuery({
    queryKey: ['queues'],
    queryFn: () => fetchApi('/queue'),
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQueueName.trim()) return;
    setCreating(true);
    
    // Default form config
    const formConfig = [];
    
    if (includeName) {
      formConfig.push({ id: 'name', type: 'text', label: 'Full Name', required: true, system: false });
    }
    
    if (includePhone) {
      formConfig.push({ id: 'phone', type: 'phone', label: 'WhatsApp Number', required: true, system: false });
    }
    
    if (includePurpose) {
      formConfig.push({
        id: 'purpose',
        type: 'dropdown',
        label: 'Purpose of Visit',
        required: true,
        options: ['General Inquiry', 'Support', 'Billing'], // default options
        system: false,
      } as any);
    }

    try {
      await fetchApi('/queue', { 
        method: 'POST', 
        body: JSON.stringify({ 
          name: newQueueName,
          formConfig
        }) 
      });
      setIsModalOpen(false);
      setNewQueueName('');
      setIncludeName(true);
      setIncludePhone(true);
      setIncludePurpose(true);
      refetch();
    } catch (e) {
      alert('Error creating queue');
    }
    setCreating(false);
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      await fetchApi(`/queue/${id}/status`, { 
        method: 'PATCH', 
        body: JSON.stringify({ status: currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' }) 
      });
      refetch();
    } catch (e) {
      alert('Error updating status');
    }
  }

  return (
    <AdminLayout>
      <Head>
        <title>Manage Queues | QMover</title>
      </Head>

      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium tracking-wider uppercase mb-1">Manage Queues</p>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Queues</h1>
          </div>
          <button 
            id="tour-create-queue-btn"
            onClick={() => setIsModalOpen(true)} 
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors shadow-[0_0_15px_rgba(79,70,229,0.3)] border border-indigo-500/50"
          >
            <Plus className="w-5 h-5" />
            Create queue
          </button>
        </div>

        {/* Queues List */}
        <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden">
          
          <div className="divide-y divide-gray-200 dark:divide-white/10">
            {isLoading && <div className="p-8 text-center text-gray-500 dark:text-zinc-500">Loading queues...</div>}
            
            {queues.map((queue: any) => (
              <div key={queue.id} className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                <div className="flex flex-col">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{queue.name}</h3>
                    <div className={`px-2 py-0.5 rounded border text-[10px] font-bold tracking-wider uppercase ${queue.status === 'ACTIVE' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'}`}>
                      {queue.status === 'ACTIVE' ? 'Running' : queue.status}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-zinc-400">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Waiting: {queue._count?.tokens || 0}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link 
                    href={`/dashboard/queues/${queue.id}`}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors border border-white/5"
                  >
                    Manage
                  </Link>
                  <Link 
                    href={`/dashboard/queues/${queue.id}/display`}
                    target="_blank"
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors border border-white/5 flex items-center gap-2"
                  >
                    <QrCode className="w-4 h-4" />
                    QR Display
                  </Link>
                  <button onClick={() => handleToggleStatus(queue.id, queue.status)} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors border border-white/5">
                    {queue.status === 'ACTIVE' ? 'Pause' : 'Resume'}
                  </button>
                  <button className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-medium transition-colors border border-red-500/20">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Queue Modal */}
      {isModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Queue</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-zinc-400" />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">Queue Name</label>
                <input 
                  type="text" 
                  autoFocus
                  value={newQueueName}
                  onChange={(e) => setNewQueueName(e.target.value)}
                  className="w-full bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="e.g. Registration Desk, Customer Support..."
                  required
                />
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3">Customer Form Setup</h3>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-3 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded-xl border border-gray-200 dark:border-white/10 cursor-pointer transition-colors">
                    <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${includeName ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-gray-300 dark:border-zinc-600'}`}>
                      {includeName && <Check className="w-3 h-3" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={includeName} onChange={(e) => setIncludeName(e.target.checked)} />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Full Name</p>
                      <p className="text-xs text-zinc-500">Collect customer's full name</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded-xl border border-gray-200 dark:border-white/10 cursor-pointer transition-colors">
                    <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${includePhone ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-gray-300 dark:border-zinc-600'}`}>
                      {includePhone && <Check className="w-3 h-3" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={includePhone} onChange={(e) => setIncludePhone(e.target.checked)} />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">WhatsApp Number</p>
                      <p className="text-xs text-zinc-500">Required for SMS notifications & OTP</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded-xl border border-gray-200 dark:border-white/10 cursor-pointer transition-colors">
                    <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${includePurpose ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-gray-300 dark:border-zinc-600'}`}>
                      {includePurpose && <Check className="w-3 h-3" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={includePurpose} onChange={(e) => setIncludePurpose(e.target.checked)} />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Purpose of Visit</p>
                      <p className="text-xs text-zinc-500">Ask customers why they are visiting (dropdown)</p>
                    </div>
                  </label>
                </div>
                <p className="text-xs text-zinc-500 mt-4">You can add more custom fields later in the Queue Settings.</p>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-200 dark:border-white/10">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={creating || !newQueueName.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors shadow-[0_0_15px_rgba(79,70,229,0.3)] disabled:opacity-50"
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  {creating ? 'Creating...' : 'Create Queue'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </AdminLayout>
  );
}
