import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AdminLayout from '../../../../components/AdminLayout';
import { ArrowLeft, ExternalLink, Scan, Settings, QrCode, Play, SkipForward, PauseCircle, CheckCircle, Plus, Trash2, GripVertical, Save, Loader2, MessageSquare, X, Send } from 'lucide-react';
import Link from 'next/link';
import { io } from 'socket.io-client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../../../lib/api';
import { useAuth } from '../../../../components/AuthContext';

export default function QueueWorkspace() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = router.query;
  const [activeTab, setActiveTab] = useState<'workspace' | 'settings'>('workspace');
  
  // Chat State
  const [chatToken, setChatToken] = useState<any>(null);
  const [chatMessage, setChatMessage] = useState('');
  
  // Settings Form Builder State
  const [formConfig, setFormConfig] = useState<any[]>([]);
  const [savingSettings, setSavingSettings] = useState(false);
  const [queueName, setQueueName] = useState('');
  const [nextQueueId, setNextQueueId] = useState<string>('');
  const [allowAppointments, setAllowAppointments] = useState(false);
  const [requireManualCheckIn, setRequireManualCheckIn] = useState(false);
  const [appointmentGranularityMins, setAppointmentGranularityMins] = useState(15);

  const { data: allQueues = [] } = useQuery({
    queryKey: ['queues'],
    queryFn: () => fetchApi('/queue'),
  });

  const queryClient = useQueryClient();

  const { data: queue = null, refetch: refetchQueue } = useQuery({
    queryKey: ['queue', id],
    queryFn: async () => {
      const q = await fetchApi(`/queue/${id}`);
      if (q) {
        setQueueName(q.name);
        setNextQueueId(q.nextQueueId || '');
        setAllowAppointments(q.allowAppointments || false);
        setRequireManualCheckIn(q.requireManualCheckIn || false);
        setAppointmentGranularityMins(q.appointmentGranularityMins || 15);
        setFormConfig(q.formConfig || [
          { id: 'name', type: 'text', label: 'Full Name', required: true, system: true },
          { id: 'phone', type: 'phone', label: 'WhatsApp Number', required: true, system: true },
        ]);
      }
      return q;
    },
    enabled: !!id,
  });

  const { data: tokens = [], refetch } = useQuery({
    queryKey: ['queueTokens', id],
    queryFn: () => fetchApi(`/queue/${id}/tokens`),
    enabled: !!id,
  });

  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ['messages', chatToken?.id],
    queryFn: () => fetchApi(`/messages/token/${chatToken.id}`),
    enabled: !!chatToken?.id,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (!id) return;
    const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000');
    socket.emit('joinQueueRoom', id);

    socket.on('token_joined', () => refetch());
    socket.on('token_serving', () => refetch());
    socket.on('token_completed', () => refetch());
    socket.on('token_missed', () => refetch());
    socket.on('new_message', () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    });

    return () => {
      socket.disconnect();
    }
  }, [id, refetch, queryClient]);

  const handleNextCustomer = async () => {
    try {
      await fetchApi(`/token/advance/${id}`, { method: 'POST' });
      refetch();
    } catch (e) {
      alert('Error advancing queue');
    }
  };

  const handleCompleteToken = async (tokenId: string) => {
    try {
      await fetchApi('/token/validate', { method: 'POST', body: JSON.stringify({ tokenId }) });
      refetch();
    } catch (e) {
      alert('Error completing token');
    }
  };

  const handleTransferToken = async (tokenId: string, targetQueueId: string) => {
    try {
      await fetchApi(`/token/${tokenId}/transfer`, { 
        method: 'POST', 
        body: JSON.stringify({ nextQueueId: targetQueueId }) 
      });
      refetch();
    } catch (e) {
      alert('Error transferring token');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !chatToken) return;
    
    try {
      const msg = chatMessage;
      setChatMessage('');
      await fetchApi(`/messages/token/${chatToken.id}`, {
        method: 'POST',
        body: JSON.stringify({ text: msg })
      });
      queryClient.invalidateQueries({ queryKey: ['messages', chatToken.id] });
    } catch (e) {
      alert('Error sending message');
    }
  };

  const handleAddField = () => {
    setFormConfig([
      ...formConfig, 
      { id: `field_${Date.now()}`, type: 'text', label: 'New Question', required: false, system: false }
    ]);
  };

  const handleUpdateField = (index: number, updates: any) => {
    const newConfig = [...formConfig];
    newConfig[index] = { ...newConfig[index], ...updates };
    setFormConfig(newConfig);
  };

  const handleRemoveField = (index: number) => {
    const newConfig = [...formConfig];
    newConfig.splice(index, 1);
    setFormConfig(newConfig);
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await fetchApi(`/queue/${id}`, { 
        method: 'PATCH',
        body: JSON.stringify({ 
          name: queueName, 
          formConfig, 
          nextQueueId: nextQueueId || null,
          allowAppointments,
          requireManualCheckIn,
          appointmentGranularityMins
        })
      });
      refetchQueue();
      alert('Settings saved successfully!');
    } catch (e) {
      alert('Error saving settings');
    }
    setSavingSettings(false);
  };

  return (
    <AdminLayout>
      <Head>
        <title>Manage {queueName || 'Queue'} | QMover</title>
      </Head>

      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        
        {/* Top bar with actions */}
        <div className="flex items-center justify-between bg-white dark:bg-zinc-900/50 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-2xl p-4 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-100 dark:border-indigo-500/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-zinc-500 font-bold mb-0.5">QUEUE</p>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-none">{queue?.name || 'Loading...'}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link 
              href={`/customer/join/${id}`}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors shadow-sm dark:shadow-none"
            >
              <ExternalLink className="w-4 h-4" /> Customer View
            </Link>
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-white rounded-lg text-sm font-medium transition-colors border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none">
              <Scan className="w-4 h-4" /> Scan
            </button>
            {user?.role === 'TENANT_ADMIN' && (
              <button 
                onClick={() => setActiveTab(activeTab === 'workspace' ? 'settings' : 'workspace')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border shadow-sm dark:shadow-none ${activeTab === 'settings' ? 'bg-indigo-50 dark:bg-white text-indigo-700 dark:text-black border-indigo-200 dark:border-white' : 'bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-white border-gray-200 dark:border-white/5'}`}
              >
                <Settings className="w-4 h-4" /> {activeTab === 'settings' ? 'Workspace' : 'Settings'}
              </button>
            )}
            <Link 
              href={`/dashboard/queues/${id}/display`}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-white rounded-lg text-sm font-medium transition-colors border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none"
            >
              <QrCode className="w-4 h-4" /> QR Display
            </Link>
          </div>
        </div>

        {activeTab === 'workspace' ? (
          <div className="space-y-8 animate-in fade-in duration-300">
            <p className="text-zinc-400 text-sm">Ready to serve visitors</p>

            {/* Queue Controls */}
            <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm dark:shadow-none">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Queue controls</h2>
              
              <div className="grid grid-cols-3 gap-6">
                <button onClick={handleNextCustomer} className="flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-transform active:scale-95">
                  <Play className="w-5 h-5 fill-current" /> Next customer
                </button>
                
                <button className="flex items-center justify-center gap-2 py-4 bg-yellow-500/10 hover:bg-yellow-500/20 dark:bg-yellow-500/20 dark:hover:bg-yellow-500/30 text-yellow-600 dark:text-yellow-500 border border-yellow-500/20 rounded-xl font-bold text-lg transition-transform active:scale-95 shadow-sm dark:shadow-none">
                  <SkipForward className="w-5 h-5" /> Skip
                </button>
                
                <button className="flex items-center justify-center gap-2 py-4 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-white/10 rounded-xl font-bold text-lg transition-transform active:scale-95 shadow-sm dark:shadow-none">
                  <PauseCircle className="w-5 h-5" /> Hold
                </button>
              </div>
            </div>

            {/* Waiting Tickets */}
            <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
              <div className="p-6 border-b border-gray-200 dark:border-white/10">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Waiting tickets</h2>
              </div>
              
              {tokens.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-zinc-500 font-medium">
                  No waiting tickets
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-white/10">
                  {tokens.map((token: any, index: number) => (
                    <div key={token.id} className="p-4 px-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500 dark:text-zinc-400 font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-gray-900 dark:text-white font-medium">{token.customerName}</p>
                          <p className="text-gray-500 dark:text-zinc-500 text-sm font-mono">{token.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${token.status === 'SERVING' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'}`}>
                          {token.status}
                        </span>
                        
                        {queue?.nextQueueId && (
                          <button 
                            onClick={() => handleTransferToken(token.id, queue.nextQueueId)}
                            className="px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 rounded-lg text-sm font-medium transition-colors"
                          >
                            Transfer
                          </button>
                        )}
                        
                        <button 
                          onClick={() => setChatToken(token)}
                          className="p-2 text-gray-400 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-400/10 rounded-lg transition-colors"
                          title="Chat via WhatsApp"
                        >
                          <MessageSquare className="w-5 h-5" />
                        </button>
                        
                        <button onClick={() => handleCompleteToken(token.id)} className="p-2 text-gray-400 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-400/10 rounded-lg transition-colors">
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* General Settings */}
            <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm dark:shadow-none">
              <div className="flex items-center justify-between mb-6 border-b border-gray-200 dark:border-white/10 pb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">General Settings</h2>
                  <p className="text-sm text-gray-500 dark:text-zinc-500">Manage basic queue settings.</p>
                </div>
                <button 
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
                >
                  {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Settings
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-400 mb-2">Queue Name</label>
                  <input 
                    type="text" 
                    value={queueName}
                    onChange={(e) => setQueueName(e.target.value)}
                    className="w-full bg-white dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm dark:shadow-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-400 mb-2">Auto-Transfer Next Queue</label>
                  <select 
                    value={nextQueueId}
                    onChange={(e) => setNextQueueId(e.target.value)}
                    className="w-full bg-white dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm dark:shadow-none appearance-none"
                  >
                    <option value="">None (End of flow)</option>
                    {allQueues
                      .filter((q: any) => q.id !== id)
                      .map((q: any) => (
                        <option key={q.id} value={q.id}>{q.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 border-t border-gray-200 dark:border-white/10 pt-6">
                <h3 className="text-md font-bold text-gray-900 dark:text-white mb-4">Appointments & Hybrid Queuing</h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/5 rounded-xl cursor-pointer">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Allow Future Appointments</p>
                      <p className="text-sm text-gray-500 dark:text-zinc-500">Customers can book timeslots instead of joining immediately.</p>
                    </div>
                    <div className="relative inline-flex items-center">
                      <input type="checkbox" checked={allowAppointments} onChange={e => setAllowAppointments(e.target.checked)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                    </div>
                  </label>

                  {allowAppointments && (
                    <>
                      <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/5 rounded-xl cursor-pointer">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Require Manual Check-In</p>
                          <p className="text-sm text-gray-500 dark:text-zinc-500">Customers must click "I have arrived" to enter the live line. If disabled, they are auto-checked in 15 mins prior.</p>
                        </div>
                        <div className="relative inline-flex items-center">
                          <input type="checkbox" checked={requireManualCheckIn} onChange={e => setRequireManualCheckIn(e.target.checked)} className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                        </div>
                      </label>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-zinc-400 mb-2">Scheduling Granularity (Minutes)</label>
                        <select 
                          value={appointmentGranularityMins}
                          onChange={(e) => setAppointmentGranularityMins(Number(e.target.value))}
                          className="w-full max-w-xs bg-white dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm dark:shadow-none appearance-none"
                        >
                          <option value={5}>5 minutes</option>
                          <option value={10}>10 minutes</option>
                          <option value={15}>15 minutes</option>
                          <option value={30}>30 minutes</option>
                          <option value={60}>60 minutes</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Form Builder */}
            <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm dark:shadow-none">
              <div className="flex items-center justify-between mb-8 border-b border-gray-200 dark:border-white/10 pb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Customer Intake Form</h2>
                  <p className="text-sm text-gray-500 dark:text-zinc-500">Customize the questions asked during virtual check-in.</p>
                </div>
                <button onClick={handleAddField} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-white rounded-lg text-sm font-medium transition-colors border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none">
                  <Plus className="w-4 h-4" /> Add Field
                </button>
              </div>

              <div className="space-y-4">
                {formConfig.map((field, index) => (
                  <div key={index} className="flex gap-4 items-start bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/5 rounded-xl p-4">
                    <div className="pt-3 text-gray-400 dark:text-zinc-600 cursor-grab active:cursor-grabbing">
                      <GripVertical className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider mb-1">Field Label</label>
                          <input 
                            type="text" 
                            value={field.label}
                            onChange={(e) => handleUpdateField(index, { label: e.target.value })}
                            className="w-full bg-white dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50 shadow-sm dark:shadow-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider mb-1">Field Type</label>
                          <select 
                            value={field.type}
                            onChange={(e) => handleUpdateField(index, { type: e.target.value })}
                            className="w-full bg-white dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50 appearance-none shadow-sm dark:shadow-none"
                          >
                            <option value="text">Short Text</option>
                            <option value="textarea">Long Text</option>
                            <option value="dropdown">Dropdown (Select)</option>
                            <option value="phone">Phone Number</option>
                            <option value="checkbox">Checkbox</option>
                          </select>
                        </div>
                      </div>
                      
                      {field.type === 'dropdown' && (
                        <div>
                          <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider mb-1">Options (comma separated)</label>
                          <input 
                            type="text" 
                            value={(field.options || []).join(', ')}
                            onChange={(e) => handleUpdateField(index, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                            placeholder="Option 1, Option 2, Option 3"
                            className="w-full bg-white dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 shadow-sm dark:shadow-none"
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={field.required}
                            onChange={(e) => handleUpdateField(index, { required: e.target.checked })}
                            className="accent-indigo-500"
                          />
                          <span className="text-sm font-medium text-gray-700 dark:text-zinc-400">Required</span>
                        </label>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleRemoveField(index)}
                      className="pt-2 p-2 text-gray-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        )}

      </div>

      {/* Chat Drawer */}
      {chatToken && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20 dark:bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-[400px] h-full bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between bg-gray-50 dark:bg-zinc-900">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-500" />
                  Chat with {chatToken.customerName}
                </h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Token: {chatToken.id}</p>
              </div>
              <button 
                onClick={() => setChatToken(null)}
                className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-sm text-gray-500 dark:text-zinc-500 mt-10">
                  No messages yet. Send a message to start the conversation via WhatsApp.
                </div>
              ) : (
                messages.map((msg: any) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'OPERATOR' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${msg.sender === 'OPERATOR' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white border border-gray-200 dark:border-white/5 rounded-bl-none'}`}>
                      <p className="text-sm">{msg.body}</p>
                      <p className={`text-[10px] mt-1 ${msg.sender === 'OPERATOR' ? 'text-indigo-200' : 'text-gray-500 dark:text-zinc-500'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-full px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors shadow-sm dark:shadow-none"
                />
                <button 
                  type="submit"
                  disabled={!chatMessage.trim()}
                  className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white transition-colors disabled:opacity-50 shadow-sm"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}
