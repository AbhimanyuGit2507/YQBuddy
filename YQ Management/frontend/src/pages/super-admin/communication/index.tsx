import React, { useState } from 'react';
import Head from 'next/head';
import SuperAdminLayout from '../../../components/SuperAdminLayout';
import { fetchApi } from '../../../lib/api';
import { useQuery } from '@tanstack/react-query';
import { Mail, Send, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SuperAdminCommunication() {
  const [testEmailTo, setTestEmailTo] = useState('');
  const [testEmailSubject, setTestEmailSubject] = useState('QMover Test Email');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(false);
  const [emailConnectionStatus, setEmailConnectionStatus] = useState<boolean | null>(null);

  const { data: emailConnection, refetch: refetchConnection } = useQuery({
    queryKey: ['superadmin-email-connection'],
    queryFn: () => fetchApi('/communication/email/connection'),
  });

  const { data: templates } = useQuery({
    queryKey: ['superadmin-email-templates'],
    queryFn: () => fetchApi('/communication/templates/email'),
  });

  const handleCheckConnection = async () => {
    setCheckingConnection(true);
    try {
      const res = await fetchApi('/communication/email/connection');
      setEmailConnectionStatus(res.connected);
      toast.success(res.connected ? 'Brevo connected' : 'Brevo disconnected');
    } catch {
      setEmailConnectionStatus(false);
      toast.error('Failed to check connection');
    }
    setCheckingConnection(false);
  };

  const handleTestEmail = async () => {
    if (!testEmailTo) return;
    setSendingTestEmail(true);
    try {
      const res = await fetchApi('/communication/test-email', { method: 'POST', body: JSON.stringify({ to: testEmailTo, subject: testEmailSubject }) });
      if (res.success) {
        toast.success('Test email sent successfully');
      } else {
        toast.error(res.error || 'Failed to send test email');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error sending test email');
    }
    setSendingTestEmail(false);
  };

  return (
    <SuperAdminLayout>
      <Head>
        <title>Email & Notifications | Super Admin</title>
      </Head>

      <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white uppercase">Email & Notifications</h1>
          <p className="text-gray-500 dark:text-rose-200/60 mt-2">Manage Brevo email configuration and test notifications.</p>
        </div>

        <div className="bg-white dark:bg-[#120005] border border-gray-200 dark:border-rose-900/30 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-rose-900/30">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-rose-500" />
              Brevo Connection
            </h2>
            <p className="text-sm text-gray-500 dark:text-rose-200/60 mt-1">Check your Brevo email service configuration.</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${emailConnectionStatus ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {emailConnectionStatus === true ? 'Connected' : emailConnectionStatus === false ? 'Disconnected' : 'Unknown'}
              </span>
            </div>
            <button
              onClick={handleCheckConnection}
              disabled={checkingConnection}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              {checkingConnection ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
              {checkingConnection ? 'Checking...' : 'Check Connection'}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-[#120005] border border-gray-200 dark:border-rose-900/30 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-rose-900/30">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-rose-500" />
              Send Test Email
            </h2>
            <p className="text-sm text-gray-500 dark:text-rose-200/60 mt-1">Send a test email to verify Brevo configuration.</p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-rose-200/60 mb-2">Recipient Email</label>
              <input
                type="email"
                placeholder="test@example.com"
                value={testEmailTo}
                onChange={(e) => setTestEmailTo(e.target.value)}
                className="w-full bg-white dark:bg-[#0a0005] border border-gray-200 dark:border-rose-900/30 rounded-xl py-3 px-4 text-gray-900 dark:text-white focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-rose-200/60 mb-2">Subject</label>
              <input
                type="text"
                value={testEmailSubject}
                onChange={(e) => setTestEmailSubject(e.target.value)}
                className="w-full bg-white dark:bg-[#0a0005] border border-gray-200 dark:border-rose-900/30 rounded-xl py-3 px-4 text-gray-900 dark:text-white focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>
            <button
              onClick={handleTestEmail}
              disabled={sendingTestEmail || !testEmailTo}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              {sendingTestEmail ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {sendingTestEmail ? 'Sending...' : 'Send Test Email'}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-[#120005] border border-gray-200 dark:border-rose-900/30 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-rose-900/30">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Email Templates</h2>
            <p className="text-sm text-gray-500 dark:text-rose-200/60 mt-1">Available email templates for system notifications.</p>
          </div>
          <div className="p-6">
            {templates?.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-rose-200/60">No templates found.</p>
            ) : (
              <div className="space-y-3">
                {templates?.map((template: any) => (
                  <div key={template.key} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-rose-900/30 bg-white dark:bg-[#0a0005]">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{template.name}</p>
                      <p className="text-xs text-gray-500 dark:text-rose-200/60 mt-1">Key: {template.key}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
