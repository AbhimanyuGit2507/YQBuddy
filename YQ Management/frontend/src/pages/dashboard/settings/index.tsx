import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import { QrCode, CheckCircle2, AlertCircle, Copy, Trash2, Shield, CreditCard, Loader2, MessageSquare, Send, Save, UserCog } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../../lib/api';
import { useAuth } from '../../../components/AuthContext';
import { useTheme } from '../../../components/ThemeProvider';
import { toast } from 'sonner';

type SettingsTab = 'General' | 'WhatsApp' | 'Billing' | 'Webhooks' | 'Invitations';

export default function SettingsPage() {
  const router = useRouter();
  const { user, refetch } = useAuth();
  const { theme: currentTheme, toggleTheme } = useTheme();
  const queryClient = useQueryClient();
  const { tab: urlTab } = router.query as { tab?: string };
  const validTabs: SettingsTab[] = ['General', 'WhatsApp', 'Billing', 'Webhooks', 'Invitations'];
  const initialTab = validTabs.includes(urlTab as SettingsTab) ? (urlTab as SettingsTab) : 'General';
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  // Personal settings
  const [theme, setTheme] = useState(user?.personalSettings?.theme || 'light');
  const [language, setLanguage] = useState(user?.personalSettings?.language || 'en');
  const [notificationsEnabled, setNotificationsEnabled] = useState(user?.personalSettings?.notificationsEnabled ?? true);
  const [savingPersonal, setSavingPersonal] = useState(false);

  useEffect(() => {
    if (user?.personalSettings?.theme) {
      const t = user.personalSettings.theme;
      const resolved = t === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : t;
      if (resolved === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('theme', resolved);
    }
  }, [user?.personalSettings?.theme]);

  useEffect(() => {
    const resolved = theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;
    if (resolved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', resolved);
  }, [theme]);

  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [instanceName, setInstanceName] = useState<string | null>(null);

  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookError, setWebhookError] = useState<string | null>(null);

  const [loadingBilling, setLoadingBilling] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const [savingTemplate, setSavingTemplate] = useState<string | null>(null);
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Test message from QMover');
  const [whatsappTemplates, setWhatsappTemplates] = useState<any[]>([]);
  const [templateDrafts, setTemplateDrafts] = useState<Record<string, string>>({});
  const hasShownWhatsAppToast = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem('templateDrafts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTemplateDrafts(parsed);
      } catch {
        setTemplateDrafts({});
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('templateDrafts', JSON.stringify(templateDrafts));
  }, [templateDrafts]);

  const { data: whatsappStatus, refetch: refetchWhatsAppStatus } = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: () => fetchApi('/whatsapp/status'),
    refetchInterval: (data: any) => {
      if (data?.state === 'open' || data?.state === 'close' || data?.state === 'unconfigured') {
        return false;
      }
      return 300;
    },
  });

  const isWhatsAppConnected = whatsappStatus?.state === 'open';
  const whatsappConnectionState = whatsappStatus?.state || 'unconfigured';

  const { data: waTemplates } = useQuery({
    queryKey: ['whatsapp-templates'],
    queryFn: () => fetchApi('/communication/templates/whatsapp'),
    enabled: activeTab === 'WhatsApp' && isWhatsAppConnected,
  });

  const { data: webhooks = [], refetch: refetchWebhooks } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => fetchApi('/webhooks'),
  });

  const { data: invitations = [], refetch: refetchInvitations } = useQuery({
    queryKey: ['invitations'],
    queryFn: () => fetchApi('/invitations'),
    enabled: activeTab === 'Invitations',
  });

  useEffect(() => {
    if (!router.isReady) return;
    const tab = router.query.tab as SettingsTab | undefined;
    if (tab && validTabs.includes(tab)) setActiveTab(tab);
  }, [router.isReady, router.query.tab]);

  useEffect(() => {
    if (whatsappStatus?.state === 'open') {
      setQrCode(null);
      setInstanceName(whatsappStatus.instanceName);
    } else if (whatsappStatus?.state === 'connecting') {
      setInstanceName(prev => prev || whatsappStatus.instanceName || null);
      if (whatsappStatus.qr) setQrCode(whatsappStatus.qr);
    } else if (whatsappStatus?.state === 'close' || whatsappStatus?.state === 'unconfigured') {
      setQrCode(null);
      setInstanceName(null);
    }
  }, [whatsappStatus]);

  useEffect(() => {
    const isDisconnected = whatsappStatus?.state === 'close' || whatsappStatus?.state === 'unconfigured';
    if (isDisconnected && activeTab !== 'WhatsApp' && !hasShownWhatsAppToast.current) {
      hasShownWhatsAppToast.current = true;
      toast.warning('WhatsApp is not connected. Connect it to send queue notifications to customers.', {
        duration: 5000,
        action: {
          label: 'Connect',
          onClick: () => setActiveTab('WhatsApp'),
        },
      });
    }
    if (whatsappStatus?.state === 'open') {
      hasShownWhatsAppToast.current = false;
    }
  }, [whatsappStatus, activeTab]);

  useEffect(() => {
    if (!router.isReady) return;
    const { status } = router.query as { status?: string };
    if (status === 'success') setStatusMessage({ type: 'success', text: 'Payment completed successfully!' });
    else if (status === 'cancelled') setStatusMessage({ type: 'error', text: 'Payment was cancelled.' });
    else if (status === 'error') setStatusMessage({ type: 'error', text: 'An error occurred during payment processing.' });
  }, [router.isReady, router.query.status]);

  useEffect(() => {
    if (waTemplates) {
      setWhatsappTemplates(waTemplates);
      const drafts: Record<string, string> = {};
      waTemplates.forEach((t: any) => { drafts[t.key] = t.content || ''; });
      setTemplateDrafts(drafts);
    }
  }, [waTemplates]);

  const handleAddWebhook = async () => {
    if (!webhookUrl) return;
    
    try {
      const url = new URL(webhookUrl);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        throw new Error('Webhook URL must use HTTP or HTTPS');
      }
    } catch (e) {
      setWebhookError('Invalid webhook URL format');
      return;
    }
    
    setWebhookError(null);
    try {
      await fetchApi('/webhooks', { method: 'POST', body: JSON.stringify({ url: webhookUrl, events: ['TOKEN_JOINED', 'TOKEN_SERVING', 'TOKEN_COMPLETED', 'TOKEN_MISSED'] }) });
      setWebhookUrl('');
      refetchWebhooks();
      setStatusMessage({ type: 'success', text: 'Webhook added' });
    } catch (e: any) { setWebhookError(e?.message || 'Error'); }
  };

  const handleDeleteWebhook = async (id: string) => {
    try { await fetchApi(`/webhooks/${id}`, { method: 'DELETE' }); refetchWebhooks(); setStatusMessage({ type: 'success', text: 'Webhook deleted' }); }
    catch (e) { setWebhookError('Error deleting webhook'); }
  };

  const handleConnectWhatsApp = async () => {
    setConnecting(true);
    setQrCode(null);
    try {
      const res = await fetchApi('/whatsapp/connect', { method: 'POST' });
      if (res.qr) setQrCode(res.qr);
      refetchWhatsAppStatus();
    } catch (e) { setStatusMessage({ type: 'error', text: 'Error connecting to WhatsApp.' }); }
    setConnecting(false);
  };

  const handleTestWhatsApp = async () => {
    if (!testPhone) return;
    setTestingWhatsApp(true);
    try {
      const res = await fetchApi('/communication/test-whatsapp', { method: 'POST', body: JSON.stringify({ phone: testPhone, message: testMessage }) });
      setStatusMessage({ type: 'success' in res && res.success ? 'success' : 'error', text: 'success' in res && res.success ? 'Test message sent' : res.error || 'Failed' });
    } catch (e: any) { setStatusMessage({ type: 'error', text: e.message || 'Error' }); }
    setTestingWhatsApp(false);
  };

  const handleSaveTemplate = async (key: string) => {
    const content = templateDrafts[key];
    if (!content) return;
    setSavingTemplate(key);
    try {
      await fetchApi(`/communication/templates/whatsapp/${key}`, { method: 'POST', body: JSON.stringify({ name: key, content }) });
      setStatusMessage({ type: 'success', text: `Template "${key}" saved` });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
    } catch (e: any) { setStatusMessage({ type: 'error', text: e.message || 'Error' }); }
    setSavingTemplate(null);
  };

  const handleTemplateChange = (key: string, value: string) => setTemplateDrafts(prev => ({ ...prev, [key]: value }));

  const handleSubscribe = async () => {
    setLoadingBilling(true);
    try { const data = await fetchApi('/billing/payments/generate-link'); setPaymentData(data); }
    catch (e) { setStatusMessage({ type: 'error', text: 'Error generating payment link' }); }
    setLoadingBilling(false);
  };

  useEffect(() => {
    if (paymentData) {
      const form = document.createElement('form');
      form.method = 'POST'; form.action = paymentData.paymentUrl;
      ['siteCode','countryCode','currencyCode','amount','transactionReference','bankReference','cancelUrl','errorUrl','successUrl','notifyUrl','isTest','hashCheck'].forEach(field => {
        const input = document.createElement('input'); input.type = 'hidden'; input.name = field.charAt(0).toUpperCase() + field.slice(1); input.value = paymentData[field]; form.appendChild(input);
      });
      document.body.appendChild(form); form.submit();
    }
  }, [paymentData]);

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await fetchApi('/invitations', { method: 'POST', body: JSON.stringify({ role: 'OPERATOR', maxUses: 5, expiresInDays: 7 }) }); refetchInvitations(); setStatusMessage({ type: 'success', text: 'Invitation created' }); }
    catch (e: any) { setStatusMessage({ type: 'error', text: e.message || 'Error' }); }
  };

  const handleRevokeInvitation = async (id: string) => {
    try { await fetchApi(`/invitations/${id}`, { method: 'DELETE' }); refetchInvitations(); setStatusMessage({ type: 'success', text: 'Invitation revoked' }); }
    catch (e) { setStatusMessage({ type: 'error', text: 'Error revoking' }); }
  };

  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); setStatusMessage({ type: 'success', text: 'Code copied' }); };

  const handleSavePersonalSettings = async () => {
    setSavingPersonal(true); setStatusMessage(null);
    try {
      await fetchApi('/auth/personal-settings', { method: 'PATCH', body: JSON.stringify({ theme, language, notificationsEnabled }) });
      const resolved = theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;
      if (resolved === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('theme', resolved);
      setStatusMessage({ type: 'success', text: 'Personal settings saved!' }); refetch(); queryClient.invalidateQueries({ queryKey: ['personalSettings'] });
    } catch (e: any) { setStatusMessage({ type: 'error', text: e.message || 'Error' }); }
    setSavingPersonal(false);
  };

  return (
    <AdminLayout>
      <Head><title>Settings | QMover</title></Head>
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <div className="flex items-end justify-between border-b border-gray-200 dark:border-white/10 pb-6">
          <div><p className="text-zinc-400 text-sm font-medium tracking-wider uppercase mb-1">Configuration</p><h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1></div>
        </div>

        {statusMessage && (
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${statusMessage.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400'}`}>
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
            <div><h3 className="font-bold">{statusMessage.type === 'success' ? 'Success' : 'Error'}</h3><p className="text-sm opacity-90">{statusMessage.text}</p></div>
          </div>
        )}

        {(whatsappStatus?.state === 'close' || whatsappStatus?.state === 'unconfigured') && (
          <div className="p-4 rounded-xl border border-yellow-200 dark:border-yellow-500/30 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-800 dark:text-yellow-300 flex items-start gap-3">
            <MessageSquare className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm">WhatsApp Not Connected</h3>
              <p className="text-xs opacity-90 mt-0.5">Connect WhatsApp to send OTPs and queue notifications to customers. Without it, customers cannot join via phone verification.</p>
              <button onClick={() => setActiveTab('WhatsApp')} className="mt-2 text-xs font-bold underline hover:no-underline">Go to WhatsApp settings</button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-8 border-b border-gray-200 dark:border-white/10">
          {validTabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-4 text-sm font-bold transition-colors relative ${activeTab === tab ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-900 dark:text-zinc-500 dark:hover:text-zinc-300'}`}>
              {tab}{activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-t-full shadow-[0_-2px_10px_rgba(99,102,241,0.5)]"></div>}
            </button>
          ))}
        </div>

        {activeTab === 'General' && (
          <div className="space-y-8">
            <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-8 border-b border-gray-200 dark:border-white/10 pb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center"><UserCog className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /></div>
                <div><h2 className="text-xl font-bold text-gray-900 dark:text-white">Personal Settings</h2><p className="text-zinc-500 dark:text-zinc-400 text-sm">Manage your preferences and notifications.</p></div>
              </div>
              <div className="space-y-8">
                <section>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Appearance</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div><label className="block text-sm font-medium text-zinc-400 mb-2">Theme</label>
                      <select value={theme} onChange={(e) => setTheme(e.target.value)} className="w-full bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none">
                        <option value="light">Light</option><option value="dark">Dark</option><option value="system">System</option>
                      </select></div>
                    <div><label className="block text-sm font-medium text-zinc-400 mb-2">Language</label>
                      <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none">
                        <option value="en">English</option><option value="es">Spanish</option><option value="fr">French</option>
                      </select></div>
                  </div>
                </section>
                <div className="h-px bg-gray-200 dark:bg-white/10 w-full"></div>
                <section>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Notifications</h3>
                  <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-black/40 rounded-2xl border border-gray-200 dark:border-white/5">
                    <div><h3 className="text-gray-900 dark:text-white font-bold mb-1">Email Notifications</h3><p className="text-zinc-500 dark:text-zinc-400 text-sm">Receive email notifications about queue updates and system alerts.</p></div>
                    <button onClick={() => setNotificationsEnabled(!notificationsEnabled)} className={`w-14 h-8 rounded-full relative transition-colors shadow-lg ${notificationsEnabled ? 'bg-indigo-600' : 'bg-zinc-500'}`}>
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${notificationsEnabled ? 'right-1' : 'left-1'}`}></div>
                    </button>
                  </div>
                </section>
                <div className="flex justify-end">
                  <button onClick={handleSavePersonalSettings} disabled={savingPersonal} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition-colors shadow-[0_0_15px_rgba(79,70,229,0.3)] disabled:opacity-50">
                    <Save className="w-5 h-5" />{savingPersonal ? 'Saving...' : 'Save Personal Settings'}
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-3xl p-8">
              <div className="mb-8 border-b border-gray-200 dark:border-white/10 pb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Business Profile</h2>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">Update your workspace details.</p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2"><label className="block text-sm font-medium text-zinc-400 mb-2">Workspace name</label>
                  <input type="text" defaultValue={user?.workspace?.name || 'My Business'} className="w-full bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors" /></div>
                <div><label className="block text-sm font-medium text-zinc-400 mb-2">Support email</label>
                  <input type="email" defaultValue={user?.email || 'support@example.com'} className="w-full bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors" /></div>
                <div><label className="block text-sm font-medium text-zinc-400 mb-2">Default Queue Name</label>
                  <input type="text" defaultValue="General Queue" className="w-full bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors" /></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'WhatsApp' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div><h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">WhatsApp Integration</h2><p className="text-zinc-400">Connect your WhatsApp to send automated queue updates.</p></div>
            {whatsappStatus?.state === 'connecting' ? (
              <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-3xl p-12 text-center">
                <div className="animate-in zoom-in duration-500">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Scan QR Code</h3>
                  {qrCode ? (
                    <div className="bg-white p-4 rounded-2xl inline-block shadow-lg mx-auto mb-6"><img src={qrCode} alt="QR" className="w-64 h-64" /></div>
                  ) : (
                    <div className="w-64 h-64 bg-gray-100 dark:bg-black/50 rounded-2xl inline-flex items-center justify-center mb-6">
                      <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                    <span className="text-zinc-500">Waiting for QR scan...</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-4">Open WhatsApp on your phone → Linked Devices → Link a Device</p>
                </div>
              </div>
            ) : !isWhatsAppConnected ? (
              <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-3xl p-12 text-center">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6"><QrCode className="w-10 h-10 text-emerald-500" /></div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Link Your WhatsApp Account</h3>
                <p className="text-zinc-500 max-w-md mx-auto mb-8">Connect WhatsApp to automatically notify customers about queue updates.</p>
                <button onClick={handleConnectWhatsApp} disabled={connecting} className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2 mx-auto">
                  {connecting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}{connecting ? 'Generating...' : 'Connect WhatsApp'}
                </button>
              </div>
            ) : (
              <>
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-8 flex items-center gap-6 relative overflow-hidden">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30"><svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
                  <div><h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Connected</h3><div className="space-y-1 text-sm font-mono text-emerald-600 dark:text-emerald-400/80"><p>Instance: {instanceName}</p><p>Status: Online & Ready</p></div></div>
                </div>
                <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-3xl p-8">
                  <div className="mb-8 border-b border-gray-200 dark:border-white/10 pb-6"><h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Message Templates</h2><p className="text-zinc-500 dark:text-zinc-400 text-sm">Configure automated WhatsApp messages.</p></div>
                  <div className="space-y-6">
                    {whatsappTemplates.map((template: any) => (
                      <div key={template.key} className="space-y-2">
                        <label className="block font-bold text-gray-900 dark:text-white">{template.name}</label>
                        <textarea rows={3} value={templateDrafts[template.key] || template.content || ''} onChange={(e) => handleTemplateChange(template.key, e.target.value)} className="w-full bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none" />
                        <div className="flex justify-end"><button onClick={() => handleSaveTemplate(template.key)} disabled={savingTemplate === template.key} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-600 text-white rounded-xl font-medium transition-colors">{savingTemplate === template.key ? 'Saving...' : 'Save Template'}</button></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-3xl p-8">
                  <div className="mb-8 border-b border-gray-200 dark:border-white/10 pb-6"><h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Test Message</h2><p className="text-zinc-500 dark:text-zinc-400 text-sm">Send a test WhatsApp message.</p></div>
                  <div className="space-y-4">
                    <div><label className="block text-sm font-medium text-zinc-400 mb-2">Phone Number</label>
                      <input type="tel" placeholder="e.g. 27821234567" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} className="w-full bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors" /></div>
                    <div><label className="block text-sm font-medium text-zinc-400 mb-2">Message</label>
                      <textarea rows={3} value={testMessage} onChange={(e) => setTestMessage(e.target.value)} className="w-full bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none" /></div>
                    <button onClick={handleTestWhatsApp} disabled={testingWhatsApp || !testPhone} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2">
                      {testingWhatsApp ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}{testingWhatsApp ? 'Sending...' : 'Send Test Message'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'Billing' && (
          <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
            {statusMessage && (
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${statusMessage.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400'}`}>
                {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
                <div><h3 className="font-bold">{statusMessage.type === 'success' ? 'Success' : 'Error'}</h3><p className="text-sm opacity-90">{statusMessage.text}</p></div>
              </div>
            )}
            <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center"><CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /></div><h2 className="text-xl font-bold text-gray-900 dark:text-white">Current Plan</h2></div>
              <div className="mb-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 border border-yellow-200 dark:border-yellow-500/20 mb-4">Trial Mode</span>
                <div className="flex items-baseline gap-1"><span className="text-4xl font-black text-gray-900 dark:text-white">R299</span><span className="text-gray-500 dark:text-zinc-400 font-medium">/month</span></div>
                <p className="text-sm text-gray-500 dark:text-zinc-400 mt-2">Unlimited queues, up to 10,000 customers per day.</p>
              </div>
              <button onClick={handleSubscribe} disabled={loadingBilling} className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#000000] hover:bg-[#1a1a1a] dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg">
                {loadingBilling ? <Loader2 className="w-5 h-5 animate-spin" /> : null}{loadingBilling ? 'Processing...' : 'Upgrade Now via Ozow'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'Webhooks' && (
          <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-3xl p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 border-b border-gray-200 dark:border-white/10 pb-6"><h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Webhooks</h2><p className="text-zinc-500 dark:text-zinc-400 text-sm">Send real-time queue events to your servers or 3rd party apps.</p></div>
            <div className="space-y-6">
              {webhooks.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Active Endpoints</h3>
                  <div className="space-y-4">{webhooks.map((w: any) => (
                    <div key={w.id} className="flex items-center justify-between bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 p-4 rounded-xl">
                      <div><p className="font-medium text-gray-900 dark:text-white">{w.url}</p><p className="text-xs text-zinc-500 mt-1">Events: {w.events.join(', ')}</p></div>
                      <button onClick={() => handleDeleteWebhook(w.id)} className="px-3 py-1.5 text-sm font-medium text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors">Delete</button>
                    </div>
                  ))}</div>
                </div>
              )}
              {webhooks.length === 0 && (
                <div className="mb-8 text-center py-8">
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm">No webhooks configured yet. Add one below to get started.</p>
                </div>
              )}
              <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-2xl p-6 border border-gray-200 dark:border-white/5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Add New Endpoint</h3>
                <div className="flex gap-4 mb-4">
                  <div className="flex-1 space-y-2"><label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider">Payload URL</label>
                    <input type="url" placeholder="https://api.example.com/webhook" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} className="w-full bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors" /></div>
                  <div className="flex items-end"><button onClick={handleAddWebhook} disabled={!webhookUrl} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-600 text-white rounded-xl font-medium transition-colors">Add Endpoint</button></div>
                </div>
                {webhookError && <p className="text-sm text-red-500 mt-2">{webhookError}</p>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Invitations' && (
          <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-3xl p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 border-b border-gray-200 dark:border-white/10 pb-6 flex items-center justify-between">
              <div><h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Invitations</h2><p className="text-zinc-500 dark:text-zinc-400 text-sm">Manage invitation codes for team members.</p></div>
              <form onSubmit={handleCreateInvitation}><button type="submit" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors"><Shield className="w-4 h-4" />Generate Code</button></form>
            </div>
            {invitations.length === 0 ? <div className="text-center py-12 text-gray-500">No invitations yet. Generate one to invite team members.</div> : (
              <div className="space-y-4">{invitations.map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 p-4 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2"><code className="bg-gray-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">{inv.code}</code>
                      <button type="button" onClick={() => copyToClipboard(inv.code)} className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"><Copy className="w-4 h-4" /></button></div>
                    <div><p className="text-sm text-gray-900 dark:text-white font-medium capitalize">{inv.role}</p><p className="text-xs text-zinc-500">{inv.usedCount} / {inv.maxUses} uses · Expires {new Date(inv.expiresAt).toLocaleDateString()}</p></div>
                  </div>
                  {inv.revoked ? <span className="text-xs text-red-500 font-medium">Revoked</span> : <button type="button" onClick={() => handleRevokeInvitation(inv.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>}
                </div>
              ))}</div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
