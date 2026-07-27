import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { fetchApi } from '../../lib/api';
import { QrCode, Loader2, ArrowRight, Store, Activity, Pizza, Briefcase, Check } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const BUSINESS_TEMPLATES = [
  {
    id: 'general',
    title: 'General',
    description: 'Standard queue for everyday use.',
    icon: Store,
    queues: [
      {
        name: 'General Queue',
        formConfig: [
          { id: 'name', type: 'text', label: 'Full Name', required: true, system: false },
          { id: 'phone', type: 'phone', label: 'WhatsApp Number', required: true, system: false }
        ]
      }
    ]
  },
  {
    id: 'hospital',
    title: 'Hospital & Clinic',
    description: 'Manage patient flow across departments.',
    icon: Activity,
    queues: [
      {
        name: 'Walk-in Clinic',
        formConfig: [
          { id: 'name', type: 'text', label: 'Patient Name', required: true, system: false },
          { id: 'phone', type: 'phone', label: 'WhatsApp Number', required: true, system: false },
          { id: 'symptoms', type: 'textarea', label: 'Primary Symptoms', required: true, system: false }
        ]
      },
      {
        name: 'Pharmacy Pickup',
        formConfig: [
          { id: 'name', type: 'text', label: 'Patient Name', required: true, system: false },
          { id: 'prescription', type: 'text', label: 'Prescription Number', required: true, system: false }
        ]
      },
      {
        name: 'Doctor Appointment',
        formConfig: [
          { id: 'name', type: 'text', label: 'Patient Name', required: true, system: false },
          { id: 'phone', type: 'phone', label: 'WhatsApp Number', required: true, system: false },
          { id: 'doctor', type: 'dropdown', label: 'Doctor', required: true, system: false, options: ['Dr. Smith', 'Dr. Johnson', 'Dr. Lee'] }
        ]
      }
    ]
  },
  {
    id: 'fastfood',
    title: 'Restaurant & Fast Food',
    description: 'Order pickups and dine-in waitlists.',
    icon: Pizza,
    queues: [
      {
        name: 'Order Pickup',
        formConfig: [
          { id: 'name', type: 'text', label: 'Customer Name', required: true, system: false },
          { id: 'orderNum', type: 'text', label: 'Order Number', required: true, system: false }
        ]
      },
      {
        name: 'Dine-in Waitlist',
        formConfig: [
          { id: 'name', type: 'text', label: 'Name', required: true, system: false },
          { id: 'phone', type: 'phone', label: 'WhatsApp Number', required: true, system: false },
          { id: 'partySize', type: 'dropdown', label: 'Party Size', required: true, system: false, options: ['1-2', '3-4', '5-6', '7+'] },
          { id: 'highChair', type: 'checkbox', label: 'Need a high chair?', required: false, system: false }
        ]
      }
    ]
  },
  {
    id: 'visa',
    title: 'Visa & Government',
    description: 'High-security document processing.',
    icon: Briefcase,
    queues: [
      {
        name: 'Document Submission',
        formConfig: [
          { id: 'name', type: 'text', label: 'Applicant Name', required: true, system: false },
          { id: 'passport', type: 'text', label: 'Passport Number', required: true, system: false },
          { id: 'visaType', type: 'dropdown', label: 'Visa Type', required: true, system: false, options: ['Tourist', 'Business', 'Student', 'Work'] }
        ]
      },
      {
        name: 'Biometrics',
        formConfig: [
          { id: 'name', type: 'text', label: 'Applicant Name', required: true, system: false },
          { id: 'phone', type: 'phone', label: 'WhatsApp Number', required: true, system: false },
          { id: 'appointmentId', type: 'text', label: 'Appointment ID', required: true, system: false }
        ]
      }
    ]
  }
];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('general');

  // WhatsApp State
  const [isWhatsAppConnected, setIsWhatsAppConnected] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    // Save token if coming from Google SSO
    const { token } = router.query;
    if (token && typeof token === 'string') {
      localStorage.setItem('token', token);
      // Clean up URL
      router.replace('/onboarding', undefined, { shallow: true });
    }
  }, [router.query]);

  const { data: whatsappStatus } = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: () => fetchApi('/whatsapp/status'),
    refetchInterval: (data: any) => (data?.state === 'connecting' || qrCode) && data?.state !== 'open' ? 3000 : false,
    enabled: step === 2,
  });

  useEffect(() => {
    if (whatsappStatus?.state === 'open') {
      setIsWhatsAppConnected(true);
      setQrCode(null);
    }
  }, [whatsappStatus]);

  const handleSetupQueues = async () => {
    setLoading(true);
    const template = BUSINESS_TEMPLATES.find(t => t.id === selectedType);
    
    try {
      if (template) {
        // Create each queue sequentially (or parallel if backend supports, but sequential is safer for SQLite/basic setups)
        await Promise.all(template.queues.map(q => 
          fetchApi('/queue', {
            method: 'POST',
            body: JSON.stringify({ name: q.name, formConfig: q.formConfig }),
          })
        ));
      }
      
      setStep(2);
    } catch (err) {
      console.error(err);
      alert('Failed to setup your queues. Please try again.');
    } finally {
      setLoading(false);
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

  const finishOnboarding = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex font-sans">
      <Head>
        <title>Onboarding | QMover</title>
      </Head>

      {/* LEFT PANEL */}
      <div className="w-1/3 min-h-screen bg-gradient-to-br from-[#1E3A8A] to-[#0F172A] p-12 flex flex-col text-white">
        <div className="flex items-center gap-2 mb-24">
          <div className="w-6 h-6 border-2 border-white rounded-sm flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-sm"></div>
          </div>
          <span className="font-bold text-xl tracking-wide">Qmover</span>
        </div>

        <div className="max-w-md">
          {step === 1 ? (
            <>
              <h1 className="text-5xl font-bold mb-6 leading-tight">What kind of business are you running?</h1>
              <p className="text-blue-200/70 text-lg leading-relaxed">
                We'll automatically set up the perfect queues and custom form questions tailored to your industry.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-5xl font-bold mb-6 leading-tight">Connect WhatsApp.</h1>
              <p className="text-blue-200/70 text-lg leading-relaxed">
                Automatically notify customers about their queue position through WhatsApp.
              </p>
            </>
          )}
        </div>

        <div className="mt-auto flex items-center gap-2">
          <div className={`w-4 h-1 rounded-full ${step === 1 ? 'bg-white' : 'bg-white/30'}`}></div>
          <div className={`w-4 h-1 rounded-full ${step === 2 ? 'bg-white' : 'bg-white/30'}`}></div>
          <div className="w-4 h-1 rounded-full bg-white/30"></div>
          <div className="w-4 h-1 rounded-full bg-white/30"></div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 bg-[#F3F4F6] flex items-center justify-center p-12 overflow-y-auto">
        <div className="w-full max-w-2xl py-12">
          
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                {BUSINESS_TEMPLATES.map((template) => {
                  const Icon = template.icon;
                  const isSelected = selectedType === template.id;
                  return (
                    <div 
                      key={template.id}
                      onClick={() => setSelectedType(template.id)}
                      className={`relative p-6 rounded-2xl cursor-pointer transition-all duration-200 border-2 ${
                        isSelected 
                          ? 'bg-white border-[#2563EB] shadow-[0_0_0_4px_rgba(37,99,235,0.1)]' 
                          : 'bg-white/60 border-transparent hover:bg-white hover:shadow-md'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-4 right-4 w-6 h-6 bg-[#2563EB] rounded-full flex items-center justify-center text-white">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${isSelected ? 'bg-blue-50 text-[#2563EB]' : 'bg-gray-100 text-gray-500'}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{template.title}</h3>
                      <p className="text-sm text-gray-500">{template.description}</p>
                      
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Includes</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {template.queues.map(q => (
                            <li key={q.name} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                              {q.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end">
                <button 
                  onClick={handleSetupQueues}
                  disabled={loading}
                  className="px-8 py-4 bg-[#2563EB] hover:bg-blue-700 rounded-xl font-bold text-white transition-colors shadow-lg disabled:opacity-70 flex justify-center items-center gap-2"
                >
                  {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                  {loading ? 'Setting up queues...' : 'Continue'}
                  {!loading && <ArrowRight className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="max-w-lg mx-auto animate-in fade-in slide-in-from-right-8 duration-500 bg-white rounded-3xl p-10 shadow-xl border border-gray-100 text-center">
              
              {!isWhatsAppConnected ? (
                <>
                  {qrCode ? (
                    <div className="animate-in zoom-in duration-500">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Scan QR Code</h3>
                      <p className="text-gray-500 max-w-sm mx-auto mb-6">
                        Open WhatsApp on your phone, go to Linked Devices, and scan this QR code.
                      </p>
                      <div className="bg-white p-4 rounded-2xl inline-block shadow-lg mx-auto mb-6 border border-gray-100">
                        <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
                      </div>
                      <div className="flex items-center justify-center gap-3 text-gray-500 font-medium">
                        <Loader2 className="w-5 h-5 animate-spin text-[#2563EB]" />
                        Waiting for connection...
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <QrCode className="w-12 h-12 text-[#2563EB]" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Link Your WhatsApp</h3>
                      <p className="text-gray-500 max-w-md mx-auto mb-8">
                        Connecting your WhatsApp allows you to automatically notify customers when they join a queue, track their position, and alert them when it's their turn.
                      </p>
                      <button 
                        onClick={handleConnectWhatsApp}
                        disabled={connecting}
                        className="w-full py-4 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 mb-4"
                      >
                        {connecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <QrCode className="w-5 h-5" />}
                        {connecting ? 'Generating QR Code...' : 'Connect WhatsApp'}
                      </button>
                      <button 
                        onClick={finishOnboarding}
                        className="w-full py-4 text-gray-500 hover:text-gray-700 font-bold transition-colors"
                      >
                        Skip for now
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="animate-in zoom-in duration-500">
                  <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">WhatsApp Connected!</h3>
                  <p className="text-gray-500 max-w-sm mx-auto mb-8">
                    Your account is successfully linked and ready to send notifications.
                  </p>
                  <button 
                    onClick={finishOnboarding}
                    className="w-full py-4 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-lg flex items-center justify-center gap-2"
                  >
                    Go to Dashboard <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
