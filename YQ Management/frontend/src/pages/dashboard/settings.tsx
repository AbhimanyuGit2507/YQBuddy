import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/AdminLayout';
import { Save, Loader2, QrCode } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../../lib/api';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('General');
  const tabs = ['General', 'WhatsApp', 'Billing', 'Webhooks'];

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => fetchApi('/auth/me'),
  });

  const [saving, setSaving] = useState(false);
  const [isWhatsAppConnected, setIsWhatsAppConnected] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [instanceName, setInstanceName] = useState<string | null>(null);

  const [chatbotEnabled, setChatbotEnabled] = useState(false);
  const [chatbotConfig, setChatbotConfig] = useState({ templates: { greeting: '', status: '', cancel: '' } });

  // Webhooks state
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState<string[]>(['TOKEN_JOINED', 'TOKEN_SERVING', 'TOKEN_COMPLETED', 'TOKEN_MISSED', 'TOKEN_CANCELLED', 'TOKEN_TRANSFERRED']);

  const { data: whatsappStatus } = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: () => fetchApi('/whatsapp/status'),
    refetchInterval: (data: any) => (data?.state === 'connecting' || qrCode) && data?.state !== 'open' ? 3000 : false,
  });

  const { data: webhooks = [], refetch: refetchWebhooks } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => fetchApi('/webhooks'),
  });

  useEffect(() => {
    if (whatsappStatus?.state === 'open') {
      setIsWhatsAppConnected(true);
      setQrCode(null);
      setInstanceName(whatsappStatus.instanceName);
    } else if (whatsappStatus?.state === 'close' || whatsappStatus?.state === 'unconfigured') {
      setIsWhatsAppConnected(false);
    }
  }, [whatsappStatus]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetchApi('/whatsapp/settings', {
        method: 'POST',
        body: JSON.stringify({
          enabled: chatbotEnabled,
          config: chatbotConfig
        })
      });
      alert('Settings saved successfully!');
    } catch (e) {
      alert('Error saving settings');
    }
    setSaving(false);
  };

  const handleAddWebhook = async () => {
    if (!webhookUrl) return;
    try {
      await fetchApi('/webhooks', {
        method: 'POST',
        body: JSON.stringify({ url: webhookUrl, events: webhookEvents })
      });
      setWebhookUrl('');
      refetchWebhooks();
    } catch (e) {
      alert('Error adding webhook');
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      await fetchApi(`/webhooks/${id}`, { method: 'DELETE' });
      refetchWebhooks();
    } catch (e) {
      alert('Error deleting webhook');
    }
  };

  const handleConnectWhatsApp = async () => {
    setConnecting(true);
    try {
      const res = await fetchApi('/whatsapp/connect', { method: 'POST' });
      if (res.qr) {
        setQrCode(res.qr);
      }
      if (res.state === 'open') {
        setIsWhatsAppConnected(true);
      }
    } catch (e) {
      alert('Error connecting to WhatsApp. Is Evolution API running?');
    }
    setConnecting(false);
  };

  if (isLoading) return <AdminLayout><div className="p-12 text-zinc-400">Loading...</div></AdminLayout>;

  return (
    <AdminLayout>
      <Head>
        <title>Settings | Qmova</title>
      </Head>

      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        
        {/* Header Section */}
        <div className="flex items-end justify-between border-b border-gray-200 dark:border-white/10 pb-6">
          <div>
            <p className="text-zinc-400 text-sm font-medium tracking-wider uppercase mb-1">Configuration</p>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          </div>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition-colors shadow-[0_0_15px_rgba(79,70,229,0.3)] disabled:opacity-50">
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-8 border-b border-gray-200 dark:border-white/10">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-sm font-bold transition-colors relative ${
                activeTab === tab ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-900 dark:text-zinc-500 dark:hover:text-zinc-300'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-t-full shadow-[0_-2px_10px_rgba(99,102,241,0.5)]"></div>
              )}
            </button>
          ))}
        </div>

        {/* Content area */}
        {activeTab === 'General' && (
          <div className="space-y-8 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-3xl p-8">
            
            {/* Business Profile */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Business Profile</h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Business name</label>
                  <input type="text" defaultValue={user?.tenant?.name || 'My Business'} className="w-full bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Support email</label>
                  <input type="email" defaultValue={user?.email || 'support@example.com'} className="w-full bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Default Queue Name</label>
                  <input type="text" defaultValue="General Queue" className="w-full bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
              </div>
            </section>

            <div className="h-px bg-gray-200 dark:bg-white/10 w-full"></div>

            {/* Location & Contact */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Location & Contact</h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Business address</label>
                  <textarea rows={3} className="w-full bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">City</label>
                  <input type="text" className="w-full bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Country</label>
                  <select defaultValue="South Africa" className="w-full bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none">
                    <option value="South Africa">South Africa</option>
                    <option value="USA">United States</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">State / Province</label>
                  <select className="w-full bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 text-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors appearance-none">
                    <option>Select state</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Mobile phone</label>
                  <div className="flex gap-2">
                    <input type="text" defaultValue="+27" className="w-20 bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors text-center" />
                    <input type="text" placeholder="123456789" className="flex-1 bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                  </div>
                </div>
              </div>
            </section>

            <div className="h-px bg-gray-200 dark:bg-white/10 w-full"></div>

            {/* Branding */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Branding</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Logo URL</label>
                  <input type="text" placeholder="https://" className="w-full bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Brand color</label>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 border border-gray-200 dark:border-white/10"></div>
                    <input type="text" defaultValue="#4F46E5" className="flex-1 bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono" />
                  </div>
                </div>
              </div>
            </section>

          </div>
        )}

        {activeTab === 'WhatsApp' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">WhatsApp Integration</h2>
              <p className="text-zinc-400">Connect your WhatsApp to send automated queue updates to your customers.</p>
            </div>

            {!isWhatsAppConnected ? (
              <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-3xl p-12 text-center">
                {qrCode ? (
                  <div className="animate-in zoom-in duration-500">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Scan QR Code</h3>
                    <p className="text-zinc-500 max-w-sm mx-auto mb-6">
                      Open WhatsApp on your phone, go to Linked Devices, and scan this QR code to connect your business account.
                    </p>
                    <div className="bg-white p-4 rounded-2xl inline-block shadow-lg mx-auto mb-6">
                      <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
                    </div>
                    <div className="flex items-center justify-center gap-3 text-zinc-500">
                      <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                      Waiting for connection...
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <QrCode className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Link Your WhatsApp Account</h3>
                    <p className="text-zinc-500 max-w-md mx-auto mb-8">
                      Connecting your WhatsApp allows you to automatically notify customers when they join a queue, track their position, and alert them when it's their turn.
                    </p>
                    <button 
                      onClick={handleConnectWhatsApp}
                      disabled={connecting}
                      className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2 mx-auto"
                    >
                      {connecting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                      {connecting ? 'Generating QR Code...' : 'Connect WhatsApp'}
                    </button>
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Connection Status Card */}
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-8 flex items-center gap-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
                  
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                    <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Connected</h3>
                    <div className="space-y-1 text-sm font-mono text-emerald-600 dark:text-emerald-400/80">
                      <p>Instance: {instanceName}</p>
                      <p>Status: Online & Ready</p>
                    </div>
                  </div>
                </div>

                {/* Message Templates & Settings */}
                <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-3xl p-8">
                  <div className="mb-8 border-b border-gray-200 dark:border-white/10 pb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Message Templates & Settings</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Configure automated WhatsApp messages sent to your customers.</p>
                  </div>

                  {/* Require OTP Verification */}
                  <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-black/40 rounded-2xl border border-gray-200 dark:border-white/5 mb-8">
                    <div>
                      <h3 className="text-gray-900 dark:text-white font-bold mb-1">Require OTP Verification</h3>
                      <p className="text-zinc-500 dark:text-zinc-400 text-sm">Send an OTP code via WhatsApp before customers can join the queue.</p>
                    </div>
                    <button className="w-14 h-8 bg-emerald-500 rounded-full relative transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                      <div className="absolute right-1 top-1 w-6 h-6 bg-white rounded-full transition-transform"></div>
                    </button>
                  </div>

                  {/* Textareas Grid */}
                  <div className="grid grid-cols-2 gap-8">
                    
                    <div className="space-y-2">
                      <label className="block font-bold text-gray-900 dark:text-white">OTP Message Template</label>
                      <textarea 
                        rows={4}
                        defaultValue="Your Qmova verification code is {{otp}}."
                        className="w-full bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                      ></textarea>
                      <p className="text-xs text-zinc-500">Available tags: <span className="text-emerald-600 dark:text-emerald-400/80 font-mono bg-emerald-400/10 px-1 rounded">{"{{otp}}"}</span> <span className="text-emerald-600 dark:text-emerald-400/80 font-mono bg-emerald-400/10 px-1 rounded">{"{{tenant_name}}"}</span></p>
                    </div>

                    <div className="space-y-2">
                      <label className="block font-bold text-gray-900 dark:text-white">Queue Joined Template</label>
                      <textarea 
                        rows={4}
                        defaultValue="Hi {{name}}, you are #{{position}} in the queue for {{queue_name}}. Your tracking code is {{code}}."
                        className="w-full bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                      ></textarea>
                      <p className="text-xs text-zinc-500">Available tags: <span className="text-emerald-600 dark:text-emerald-400/80 font-mono bg-emerald-400/10 px-1 rounded">{"{{name}}"}</span> <span className="text-emerald-600 dark:text-emerald-400/80 font-mono bg-emerald-400/10 px-1 rounded">{"{{position}}"}</span> <span className="text-emerald-600 dark:text-emerald-400/80 font-mono bg-emerald-400/10 px-1 rounded">{"{{queue_name}}"}</span> <span className="text-emerald-600 dark:text-emerald-400/80 font-mono bg-emerald-400/10 px-1 rounded">{"{{code}}"}</span></p>
                    </div>

                    <div className="space-y-2">
                      <label className="block font-bold text-gray-900 dark:text-white">Approaching Reminder (Top 5)</label>
                      <textarea 
                        rows={4}
                        defaultValue="Get ready {{name}}! There are only {{ahead_count}} people ahead of you in {{queue_name}}."
                        className="w-full bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                      ></textarea>
                    </div>

                    <div className="space-y-2">
                      <label className="block font-bold text-gray-900 dark:text-white">It's Your Turn Template</label>
                      <textarea 
                        rows={4}
                        defaultValue="It's your turn, {{name}}! Please proceed to the counter."
                        className="w-full bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                      ></textarea>
                    </div>

                  </div>
                </div>

                {/* Chatbot Configuration */}
                <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-3xl p-8 mt-8">
                  <div className="mb-8 border-b border-gray-200 dark:border-white/10 pb-6 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Two-Way Chatbot</h2>
                      <p className="text-zinc-500 dark:text-zinc-400 text-sm">Allow customers to check status or cancel via WhatsApp replies.</p>
                    </div>
                    <button 
                      onClick={() => setChatbotEnabled(!chatbotEnabled)}
                      className={`w-14 h-8 rounded-full relative transition-colors shadow-lg ${chatbotEnabled ? 'bg-indigo-600' : 'bg-zinc-500'}`}
                    >
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${chatbotEnabled ? 'right-1' : 'left-1'}`}></div>
                    </button>
                  </div>

                  {chatbotEnabled && (
                    <div className="grid grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
                      <div className="space-y-2 col-span-2">
                        <label className="block font-bold text-gray-900 dark:text-white">Bot Greeting (Menu)</label>
                        <textarea 
                          rows={4}
                          value={chatbotConfig.templates.greeting || "Hello! How can we help you today? Reply with:\n\n*STATUS* - Check your queue position\n*CANCEL* - Leave the queue"}
                          onChange={(e) => setChatbotConfig({ ...chatbotConfig, templates: { ...chatbotConfig.templates, greeting: e.target.value } })}
                          className="w-full bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                        ></textarea>
                      </div>

                      <div className="space-y-2">
                        <label className="block font-bold text-gray-900 dark:text-white">Status Reply Template</label>
                        <textarea 
                          rows={3}
                          value={chatbotConfig.templates.status || "You are number {position} in the {queueName} queue."}
                          onChange={(e) => setChatbotConfig({ ...chatbotConfig, templates: { ...chatbotConfig.templates, status: e.target.value } })}
                          className="w-full bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                        ></textarea>
                        <p className="text-xs text-zinc-500">Available tags: <span className="text-indigo-600 dark:text-indigo-400 font-mono bg-indigo-400/10 px-1 rounded">{'{position}'}</span> <span className="text-indigo-600 dark:text-indigo-400 font-mono bg-indigo-400/10 px-1 rounded">{'{queueName}'}</span></p>
                      </div>

                      <div className="space-y-2">
                        <label className="block font-bold text-gray-900 dark:text-white">Cancel Reply Template</label>
                        <textarea 
                          rows={3}
                          value={chatbotConfig.templates.cancel || "Your token has been successfully cancelled."}
                          onChange={(e) => setChatbotConfig({ ...chatbotConfig, templates: { ...chatbotConfig.templates, cancel: e.target.value } })}
                          className="w-full bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                        ></textarea>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Webhooks Tab */}
        {activeTab === 'Webhooks' && (
          <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-3xl p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 border-b border-gray-200 dark:border-white/10 pb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Webhooks</h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">Send real-time queue events to your own servers or 3rd party apps (Zapier, Make.com).</p>
            </div>

            <div className="space-y-6">
              {webhooks.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Active Endpoints</h3>
                  <div className="space-y-4">
                    {webhooks.map((w: any) => (
                      <div key={w.id} className="flex items-center justify-between bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 p-4 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{w.url}</p>
                          <p className="text-xs text-zinc-500 mt-1">Events: {w.events.join(', ')}</p>
                        </div>
                        <button 
                          onClick={() => handleDeleteWebhook(w.id)}
                          className="px-3 py-1.5 text-sm font-medium text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-2xl p-6 border border-gray-200 dark:border-white/5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Add New Endpoint</h3>
                <div className="flex gap-4 mb-4">
                  <div className="flex-1 space-y-2">
                    <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider">Payload URL</label>
                    <input 
                      type="url" 
                      placeholder="https://api.example.com/webhook"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className="w-full bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div className="flex items-end">
                    <button 
                      onClick={handleAddWebhook}
                      disabled={!webhookUrl}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-600 text-white rounded-xl font-medium transition-colors"
                    >
                      Add Endpoint
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
