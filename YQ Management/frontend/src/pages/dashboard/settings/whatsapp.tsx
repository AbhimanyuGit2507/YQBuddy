import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import SettingsLayout from '../../../components/SettingsLayout';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchApi } from '../../../lib/api';
import { toast } from 'sonner';
import { MessageSquare, QrCode, Smartphone, Loader2, Send, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react'; // Wait, let's just use an img or whatever was there. Actually, let's use the provided qrcode or standard img. 
import PhoneInput from '../../../components/PhoneInput';
export default function WhatsAppSettingsPage() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [instanceName, setInstanceName] = useState<string | null>(null);
  const [connectionMode, setConnectionMode] = useState<'qr' | 'code'>('qr');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingPhoneNumber, setPairingPhoneNumber] = useState('');
  const [pairingCountryCode, setPairingCountryCode] = useState('+1');
  const [generatingPairingCode, setGeneratingPairingCode] = useState(false);

  const [savingTemplate, setSavingTemplate] = useState<string | null>(null);
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testCountryCode, setTestCountryCode] = useState('+1');
  const [testMessage, setTestMessage] = useState('Test message from QMover');
  const [templateDrafts, setTemplateDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    const saved = localStorage.getItem('templateDrafts');
    if (saved) {
      try { setTemplateDrafts(JSON.parse(saved)); } catch {}
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
      return 2000;
    },
  });

  const isWhatsAppConnected = whatsappStatus?.state === 'open';

  const { data: waTemplates, refetch: refetchTemplates } = useQuery({
    queryKey: ['whatsapp-templates'],
    queryFn: () => fetchApi('/communication/templates/whatsapp'),
    enabled: isWhatsAppConnected,
  });

  useEffect(() => {
    if (whatsappStatus?.state === 'open') {
      setQrCode(null);
      setPairingCode(null);
      setPairingPhoneNumber('');
      setInstanceName(whatsappStatus.instanceName);
    } else if (whatsappStatus?.state === 'connecting') {
      setInstanceName(prev => prev || whatsappStatus.instanceName || null);
      if (whatsappStatus.qr) setQrCode(whatsappStatus.qr);
    } else if (whatsappStatus?.state === 'close' || whatsappStatus?.state === 'unconfigured') {
      setQrCode(null);
      setInstanceName(null);
    }
  }, [whatsappStatus]);

  const connectWhatsAppMutation = useMutation({
    mutationFn: () => fetchApi('/whatsapp/connect', { method: 'POST' }),
    onSuccess: (res) => {
      if (res.qr) setQrCode(res.qr);
      refetchWhatsAppStatus();
    },
  });

  const generatePairingCodeMutation = useMutation({
    mutationFn: (phoneNumber: string) => fetchApi('/whatsapp/pairing-code', { 
      method: 'POST',
      body: JSON.stringify({ phoneNumber })
    }),
    onSuccess: (res) => {
      if (res.pairingCode) setPairingCode(res.pairingCode);
      refetchWhatsAppStatus();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to generate pairing code');
    }
  });

  const disconnectWhatsAppMutation = useMutation({
    mutationFn: () => fetchApi('/whatsapp/disconnect', { method: 'POST' }),
    onSuccess: () => {
      setQrCode(null);
      setInstanceName(null);
      setPairingCode(null);
      refetchWhatsAppStatus();
      toast.success('WhatsApp disconnected successfully');
    },
  });

  const testWhatsAppMutation = useMutation({
    mutationFn: (data: { phone: string, message: string }) => fetchApi('/whatsapp/test', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => toast.success('Test message sent successfully!'),
    onError: (err: any) => toast.error(err.message || 'Failed to send test message')
  });

  const saveTemplateMutation = useMutation({
    mutationFn: (data: { id: string, content: string }) => fetchApi(`/communication/templates/whatsapp/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify({ content: data.content })
    }),
    onSuccess: () => {
      toast.success('Template saved successfully');
      refetchTemplates();
      setSavingTemplate(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save template');
      setSavingTemplate(null);
    }
  });

  return (
    <SettingsLayout pageTitle="WhatsApp Settings" pageSubtitle="Connect your WhatsApp account to send queue notifications">
      <Head>
        <title>WhatsApp Settings | Qmova</title>
      </Head>

      <div className="space-y-8 max-w-4xl">
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">WhatsApp Integration</h2>
          </div>

          <div className="grid gap-6 p-6 border border-gray-200 dark:border-zinc-800 rounded-2xl bg-gray-50/50 dark:bg-zinc-800/20">
            {isWhatsAppConnected ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-green-50 dark:border-green-900/10">
                  <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">WhatsApp is Connected</h3>
                <p className="text-gray-500 dark:text-zinc-400 mb-8 max-w-md mx-auto">
                  Your device is successfully paired. You can now send automated queue notifications to your customers.
                </p>
                <div className="flex items-center justify-center gap-4">
                  <button 
                    onClick={() => disconnectWhatsAppMutation.mutate()}
                    disabled={disconnectWhatsAppMutation.isPending}
                    className="px-6 py-2.5 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-xl font-medium transition-colors"
                  >
                    Disconnect Device
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 dark:text-zinc-400 mb-6">
                  Connect your business WhatsApp account to automatically notify customers about their queue status.
                </p>
                
                {!qrCode && !pairingCode ? (
                  <div className="flex justify-center">
                     <button
                        onClick={() => connectWhatsAppMutation.mutate()}
                        disabled={connectWhatsAppMutation.isPending}
                        className="px-6 py-3 bg-[#25D366] hover:bg-[#1DA851] text-white font-medium rounded-xl transition-all shadow-sm flex items-center gap-2"
                      >
                        {connectWhatsAppMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <QrCode className="w-5 h-5" />}
                        Connect WhatsApp
                      </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800">
                    {/* Simplified QR Code placeholder just to get it working in UI - in a real app, use QRCodeSVG component */}
                    {connectionMode === 'qr' && qrCode && (
                       <div className="w-64 h-64 bg-gray-100 border flex items-center justify-center rounded-xl p-4">
                         <img src={qrCode.startsWith('data:image') ? qrCode : `data:image/png;base64,${qrCode}`} alt="WhatsApp QR Code" className="w-full h-full object-contain" />
                       </div>
                    )}
                    {connectionMode === 'code' && (
                      <div className="w-full max-w-sm flex flex-col items-center">
                        {pairingCode ? (
                          <div className="text-4xl font-mono tracking-widest font-bold text-gray-900 dark:text-white mb-6 bg-gray-100 dark:bg-zinc-800 py-4 px-8 rounded-2xl">
                             {pairingCode}
                          </div>
                        ) : (
                          <div className="w-full flex flex-col gap-3 mb-6">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Enter WhatsApp Phone Number</label>
                            <PhoneInput 
                              value={pairingPhoneNumber}
                              onChange={setPairingPhoneNumber}
                              countryCode={pairingCountryCode}
                              onCountryCodeChange={setPairingCountryCode}
                              placeholder="234 567 8900"
                              className="w-full"
                            />
                            <button 
                              onClick={() => generatePairingCodeMutation.mutate(`${pairingCountryCode}${pairingPhoneNumber}`)}
                              disabled={generatePairingCodeMutation.isPending || !pairingPhoneNumber}
                              className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                              {generatePairingCodeMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                              Get Pairing Code
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-gray-500 mt-4 text-center max-w-sm">
                      {connectionMode === 'qr' ? 'Open WhatsApp on your phone, go to Linked Devices, and scan this QR code.' : 'Open WhatsApp on your phone, you will receive a notification to enter this code.'}
                    </p>
                    <div className="mt-6 flex gap-4">
                       <button onClick={() => setConnectionMode('qr')} className={`px-4 py-2 rounded-lg text-sm font-medium ${connectionMode === 'qr' ? 'bg-gray-200 text-gray-900' : 'text-gray-500'}`}>Use QR</button>
                       <button onClick={() => setConnectionMode('code')} className={`px-4 py-2 rounded-lg text-sm font-medium ${connectionMode === 'code' ? 'bg-gray-200 text-gray-900' : 'text-gray-500'}`}>Use Pairing Code</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
        
        {isWhatsAppConnected && (
          <section className="pt-8 border-t border-gray-200 dark:border-zinc-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Send a Test Message</h3>
            <div className="flex gap-4 items-start">
               <PhoneInput 
                 value={testPhone} 
                 onChange={setTestPhone} 
                 countryCode={testCountryCode}
                 onCountryCodeChange={setTestCountryCode}
                 placeholder="234 567 8900"
                 className="flex-1" 
               />
               <button 
                  onClick={() => testWhatsAppMutation.mutate({ phone: `${testCountryCode}${testPhone}`, message: testMessage })}
                  disabled={testWhatsAppMutation.isPending || !testPhone}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl flex items-center gap-2"
               >
                 {testWhatsAppMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                 Send
               </button>
            </div>
          </section>
        )}
      </div>
    </SettingsLayout>
  );
}
