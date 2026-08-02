import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import SettingsLayout from '../../../components/SettingsLayout';
import { CreditCard, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { fetchApi } from '../../../lib/api';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';

export default function BillingSettings() {
  const router = useRouter();
  const [paymentData, setPaymentData] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const subscribeMutation = useMutation({
    mutationFn: () => fetchApi('/payments/generate-link'),
    onSuccess: (data) => {
      setPaymentData(data);
    },
    onError: () => {
      toast.error('Error generating payment link');
    },
  });

  useEffect(() => {
    // Handle redirect status
    if (router.query.status === 'success') {
      setStatusMessage({ type: 'success', text: 'Payment completed successfully! Your subscription is now active.' });
    } else if (router.query.status === 'cancelled') {
      setStatusMessage({ type: 'error', text: 'Payment was cancelled.' });
    } else if (router.query.status === 'error') {
      setStatusMessage({ type: 'error', text: 'An error occurred during payment processing.' });
    }
  }, [router.query.status]);

  const handleSubscribe = () => {
    subscribeMutation.mutate();
  };

  useEffect(() => {
    if (paymentData) {
      // Create a hidden form and submit it to Ozow
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = paymentData.paymentUrl;

      // Add all fields
      const fields = ['siteCode', 'countryCode', 'currencyCode', 'amount', 'transactionReference', 'bankReference', 'cancelUrl', 'errorUrl', 'successUrl', 'notifyUrl', 'isTest', 'hashCheck'];
      
      fields.forEach(field => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = field.charAt(0).toUpperCase() + field.slice(1); // Ozow expects TitleCase like SiteCode
        input.value = paymentData[field];
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    }
  }, [paymentData]);

  return (
    <SettingsLayout pageTitle="Billing & Subscriptions" pageSubtitle="Manage your plan and payment methods">
      <Head>
        <title>Billing | QMover</title>
      </Head>

      <div className="max-w-4xl space-y-8 pb-12">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing & Subscriptions</h1>
          <p className="text-gray-500 dark:text-zinc-400 mt-2">Manage your current plan, payment methods, and billing history.</p>
        </div>

        {statusMessage && (
          <div className={`p-4 rounded-xl border ${statusMessage.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400'} flex items-start gap-3`}>
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
            <div>
              <h3 className="font-bold">{statusMessage.type === 'success' ? 'Payment Successful' : 'Payment Failed'}</h3>
              <p className="text-sm opacity-90">{statusMessage.text}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Plan */}
          <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-2xl p-8 shadow-sm dark:shadow-none">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Current Plan</h2>
            </div>

            <div className="mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 border border-yellow-200 dark:border-yellow-500/20 mb-4">
                Trial Mode
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-gray-900 dark:text-white">R299</span>
                <span className="text-gray-500 dark:text-zinc-400 font-medium">/month</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mt-2">Unlimited queues, up to 10,000 customers per day.</p>
            </div>

            <div className="space-y-3 mb-8">
              {['Unlimited Virtual Queues', 'WhatsApp Notifications', 'Advanced Analytics', 'Text-to-Speech Announcements'].map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  {feature}
                </div>
              ))}
            </div>

            <button 
              onClick={handleSubscribe}
              disabled={subscribeMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#000000] hover:bg-[#1a1a1a] dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
            >
              {subscribeMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {subscribeMutation.isPending ? 'Processing...' : 'Upgrade Now via Ozow'}
            </button>
          </div>

          {/* Payment Methods / Info */}
          <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-2xl p-8 shadow-sm dark:shadow-none">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Secure Payments</h2>
            <p className="text-gray-500 dark:text-zinc-400 text-sm mb-6 leading-relaxed">
              We use Ozow to securely process Instant EFT payments directly from your bank account. It's fast, secure, and doesn't require a credit card.
            </p>
            
            <div className="p-4 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/5 rounded-xl">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-2">Supported Banks:</h3>
              <div className="flex flex-wrap gap-2">
                {['Capitec', 'FNB', 'Standard Bank', 'Absa', 'Nedbank', 'Investec', 'TymeBank', 'African Bank', 'Discovery Bank'].map(bank => (
                  <span key={bank} className="px-2.5 py-1 text-xs font-medium bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-lg text-gray-600 dark:text-zinc-300">
                    {bank}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </SettingsLayout>
  );
}
