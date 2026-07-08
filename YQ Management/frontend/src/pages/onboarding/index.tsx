import React, { useState } from 'react';
import Head from 'next/head';
import { Building2, Globe, ListTodo, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: '',
    subdomain: '',
    queueName: ''
  });

  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleComplete = () => {
    // In a real app, this would submit the setup data to the backend
    window.location.href = '/admin';
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <Head>
        <title>Setup your workspace | YQ Queue</title>
      </Head>

      {/* Background glowing effects */}
      <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-indigo-600/20 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-purple-600/20 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-2xl z-10">
        
        {/* Progress Tracker */}
        <div className="mb-12 flex justify-between relative">
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/10 -translate-y-1/2 z-0"></div>
          <div 
            className="absolute top-1/2 left-0 h-[2px] bg-indigo-500 -translate-y-1/2 z-0 transition-all duration-500"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          ></div>
          
          {[1, 2, 3, 4].map(num => (
            <div 
              key={num} 
              className={`w-10 h-10 rounded-full flex items-center justify-center relative z-10 transition-colors duration-300 font-bold ${
                step >= num 
                  ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' 
                  : 'bg-zinc-900 border border-white/20 text-zinc-500'
              }`}
            >
              {step > num ? <CheckCircle2 className="w-5 h-5" /> : num}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl min-h-[400px] flex flex-col">
          
          {step === 1 && (
            <div className="flex-1 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6">
                <Building2 className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold mb-3">Welcome! What's your company name?</h1>
              <p className="text-zinc-400 mb-8">This will be displayed on digital signage and customer tickets.</p>
              
              <input 
                type="text" 
                value={formData.companyName}
                onChange={e => setFormData({...formData, companyName: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-5 text-white text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="e.g. Acme Health Clinic"
                autoFocus
              />
            </div>
          )}

          {step === 2 && (
            <div className="flex-1 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-6">
                <Globe className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold mb-3">Claim your web address</h1>
              <p className="text-zinc-400 mb-8">This is where your customers will go to join your queues virtually.</p>
              
              <div className="flex items-center">
                <input 
                  type="text" 
                  value={formData.subdomain}
                  onChange={e => setFormData({...formData, subdomain: e.target.value})}
                  className="flex-1 bg-black/50 border border-white/10 border-r-0 rounded-l-xl py-4 px-5 text-white text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-right"
                  placeholder="acme-health"
                  autoFocus
                />
                <div className="bg-zinc-800 border border-white/10 border-l-0 rounded-r-xl py-4 px-5 text-zinc-400 text-lg select-none">
                  .yqqueue.com
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex-1 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="w-12 h-12 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center mb-6">
                <ListTodo className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold mb-3">Create your first queue</h1>
              <p className="text-zinc-400 mb-8">You can add more queues later. Let's start with a general one.</p>
              
              <input 
                type="text" 
                value={formData.queueName}
                onChange={e => setFormData({...formData, queueName: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-5 text-white text-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                placeholder="e.g. Walk-in Registration, or Doctor Consultation"
                autoFocus
              />
            </div>
          )}

          {step === 4 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(99,102,241,0.5)]">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">You're all set!</h1>
              <p className="text-xl text-zinc-400 max-w-md mx-auto">
                Your workspace is ready. Let's dive into your dashboard and start orchestrating your queues.
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between pt-6 border-t border-white/10">
            {step > 1 && step < 4 ? (
              <button 
                onClick={prevStep}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            ) : <div></div>}
            
            {step < 4 ? (
              <button 
                onClick={nextStep}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition-colors ml-auto"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                onClick={handleComplete}
                className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-black font-bold text-lg hover:scale-[1.02] transition-transform"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
