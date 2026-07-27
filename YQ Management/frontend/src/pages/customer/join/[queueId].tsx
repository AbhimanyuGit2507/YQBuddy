import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchApi } from '../../../lib/api';
import { languages, t } from '../../../lib/i18n';
import PhoneInput from '../../../components/PhoneInput';

export default function JoinQueue() {
  const router = useRouter();
  const { queueId } = router.query;
  const [step, setStep] = useState<1 | 2>(1);
  
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [language, setLanguage] = useState('en');
  const [joinMode, setJoinMode] = useState<'immediate' | 'appointment'>('immediate');
  const [scheduledFor, setScheduledFor] = useState<string>('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('+1');

  const { data: queue, isLoading: isLoadingQueue } = useQuery({
    queryKey: ['queue', queueId],
    queryFn: () => fetchApi(`/queue/${queueId}`),
    enabled: !!queueId,
  });

  const { data: whatsappStatus } = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: () => fetchApi('/whatsapp/status'),
    enabled: !!queueId,
    refetchInterval: 5000,
  });

  const isWhatsAppConnected = whatsappStatus?.state === 'open';

  const phoneField = queue?.formConfig?.find((f: any) => f.type === 'phone');
  const phoneFieldId = phoneField?.id;

  const requestOtpMutation = useMutation({
    mutationFn: (phone: string) => fetchApi('/token/request-otp', {
      method: 'POST',
      body: JSON.stringify({ phone })
    }),
    onSuccess: () => {
      setStep(2);
      setError('');
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to send OTP. Please try again.');
    }
  });

  const joinMutation = useMutation({
    mutationFn: (data: { queueId: string, customerName: string, phone?: string, otp?: string, formResponses: any, language: string, scheduledFor?: string }) => 
      fetchApi('/token/join', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: (data) => {
      router.push(`/customer/confirmation/${data.id}`);
    },
    onError: (err: any) => {
      setError(err.message || 'Invalid OTP. Please try again.');
    }
  });

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (queue?.formConfig) {
      for (const field of queue.formConfig) {
        if (field.required && !responses[field.id]) {
          setError(`Please fill in: ${field.label}`);
          return;
        }
      }
    }

    if (joinMode === 'appointment' && !scheduledFor) {
      setError('Please select a date and time for your appointment.');
      return;
    }

    if (phoneField && isWhatsAppConnected) {
      const rawPhone = responses[phoneField.id];
      const fullPhone = rawPhone ? `${phoneCountryCode}${rawPhone.replace(/\D/g, '')}` : '';
      if (!fullPhone && phoneField.required) {
        setError('Please enter your phone number.');
        return;
      }
      if (fullPhone) {
        requestOtpMutation.mutate(fullPhone);
      } else {
        joinMutation.mutate({
          queueId: queueId as string,
          customerName: responses['name'] || 'Customer',
          phone: undefined,
          otp: undefined,
          formResponses: responses,
          language,
          scheduledFor: joinMode === 'appointment' ? new Date(scheduledFor).toISOString() : undefined
        });
      }
    } else {
      joinMutation.mutate({
        queueId: queueId as string,
        customerName: responses['name'] || 'Customer',
        phone: undefined,
        otp: undefined,
        formResponses: responses,
        language,
        scheduledFor: joinMode === 'appointment' ? new Date(scheduledFor).toISOString() : undefined
      });
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    const rawPhone = phoneFieldId ? responses[phoneFieldId] : undefined;
    const fullPhone = rawPhone ? `${phoneCountryCode}${rawPhone.replace(/\D/g, '')}` : undefined;
    joinMutation.mutate({
      queueId: queueId as string,
      customerName: responses['name'] || 'Customer',
      phone: fullPhone,
      otp,
      formResponses: responses,
      language,
      scheduledFor: joinMode === 'appointment' ? new Date(scheduledFor).toISOString() : undefined
    });
  };

  const handleInputChange = (id: string, value: any) => {
    setResponses(prev => ({ ...prev, [id]: value }));
  };

  if (isLoadingQueue) {
    return <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white flex items-center justify-center">Loading...</div>;
  }

  if (!queue) {
    return <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white flex items-center justify-center">Queue not found</div>;
  }

  const formConfig = queue.formConfig || [
    { id: 'name', type: 'text', label: 'Full Name', required: true, system: true },
    { id: 'phone', type: 'phone', label: 'WhatsApp Number', required: true, system: true },
  ];

  const showPhoneField = phoneField && isWhatsAppConnected;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors">
      <Head>
        <title>Join {queue.name} | QMover</title>
      </Head>

      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none z-0"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none z-0"></div>

      <div className="absolute top-6 right-6 z-20">
        <select 
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-white/10 border border-white/20 text-gray-900 dark:text-white rounded-lg px-3 py-1.5 text-sm outline-none cursor-pointer backdrop-blur-md"
        >
          {languages.map(l => (
            <option key={l.code} value={l.code} className="text-gray-900">{l.name}</option>
          ))}
        </select>
      </div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-2xl shadow-[0_0_20px_rgba(99,102,241,0.4)]">
            YQ
          </div>
          <h1 className="text-3xl font-bold mb-2">{t(language, 'joinQueue')} {queue.name}</h1>
          <p className="text-gray-500 dark:text-zinc-400">Please enter your details to join the queue.</p>
        </div>

        <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-8 shadow-xl dark:shadow-[0_0_40px_rgba(0,0,0,0.3)]">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-100 border border-red-200 text-red-600 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequestOtp} className="space-y-5">
              {formConfig.map((field: any) => {
                if (field.type === 'phone' && !showPhoneField) return null;
                
                return (
                  <div key={field.id}>
                    {field.type !== 'checkbox' && (
                      <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                    )}

                    {field.type === 'text' && (
                      <input 
                        type="text" 
                        value={responses[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        required={field.required}
                      />
                    )}

                    {field.type === 'phone' && showPhoneField && (
                      <div>
                        <PhoneInput
                          value={responses[field.id] || ''}
                          onChange={(val) => handleInputChange(field.id, val)}
                          countryCode={phoneCountryCode}
                          onCountryCodeChange={setPhoneCountryCode}
                          placeholder="234 567 8900"
                          required={field.required}
                        />
                        <p className="text-xs text-gray-500 dark:text-zinc-500 mt-2">We'll send you an OTP via WhatsApp to verify your number.</p>
                      </div>
                    )}

                    {field.type === 'textarea' && (
                      <textarea 
                        value={responses[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                        rows={3}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        required={field.required}
                      />
                    )}

                    {field.type === 'dropdown' && (
                      <select
                        value={responses[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        required={field.required}
                        className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                      >
                        <option value="" disabled>Select an option</option>
                        {(field.options || []).map((opt: string, i: number) => (
                          <option key={i} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}

                    {field.type === 'checkbox' && (
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={!!responses[field.id]}
                          onChange={(e) => handleInputChange(field.id, e.target.checked)}
                          required={field.required}
                          className="w-5 h-5 accent-indigo-600 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </span>
                      </label>
                    )}
                  </div>
                );
              })}

              {!showPhoneField && phoneField && (
                <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-xl p-4">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    Phone verification is currently unavailable. You can join the queue without WhatsApp notifications.
                  </p>
                </div>
              )}

              {queue?.allowAppointments && (
                <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-white/10">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-zinc-300">When do you want to join?</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button" 
                      onClick={() => setJoinMode('immediate')}
                      className={`p-3 rounded-xl border text-sm font-medium transition-all ${joinMode === 'immediate' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-700 dark:bg-black/50 dark:border-white/10 dark:text-zinc-400'}`}
                    >
                      Join Now
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setJoinMode('appointment')}
                      className={`p-3 rounded-xl border text-sm font-medium transition-all ${joinMode === 'appointment' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-700 dark:bg-black/50 dark:border-white/10 dark:text-zinc-400'}`}
                    >
                      Book Later
                    </button>
                  </div>
                  
                  {joinMode === 'appointment' && (
                    <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">Select Date & Time</label>
                      <input 
                        type="datetime-local" 
                        value={scheduledFor}
                        onChange={(e) => setScheduledFor(e.target.value)}
                        step={queue.appointmentGranularityMins ? queue.appointmentGranularityMins * 60 : 900}
                        min={new Date().toISOString().slice(0,16)}
                        className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                        required
                      />
                    </div>
                  )}
                </div>
              )}

              <button 
                type="submit"
                disabled={requestOtpMutation.isPending}
                className="w-full py-4 mt-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(79,70,229,0.3)]"
              >
                {requestOtpMutation.isPending ? 'Sending OTP...' : 'Continue'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-600 dark:text-zinc-400">
                  Enter the 6-digit code sent to <br/>
                  <strong className="text-gray-900 dark:text-white">{phoneCountryCode} {responses[phoneFieldId]}</strong>
                </p>
              </div>

              <div>
                <input 
                  type="text" 
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-4 text-center text-3xl tracking-[1em] text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="------"
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={joinMutation.isPending || otp.length !== 6}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(79,70,229,0.3)]"
              >
                {joinMutation.isPending ? 'Verifying...' : 'Verify & Join Queue'}
              </button>

              <button 
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-2 text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300 text-sm transition-colors"
              >
                Use a different number
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
