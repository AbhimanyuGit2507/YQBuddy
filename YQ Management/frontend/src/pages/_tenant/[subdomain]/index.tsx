import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import { fetchApi } from '../../../lib/api';
import { MapPin, ArrowRight } from 'lucide-react';

interface TenantPortalProps {
  tenant: any;
  queues: any[];
  error?: string;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { subdomain } = context.params as { subdomain: string };

  try {
    // We must fetch from the backend on the server side
    // In getServerSideProps, fetchApi uses absolute URL if needed, but since we are server-side,
    // we need to pass the full URL or handle it properly.
    // Assuming fetchApi handles relative/absolute correctly, or we can use the env var
    const baseUrl = 'https://qmova-backend.onrender.com' || 'http://localhost:3000/api';
    
    const tenantRes = await fetch(`${baseUrl}/tenant/public/${subdomain}`);
    if (!tenantRes.ok) {
      if (tenantRes.status === 404) {
        return { notFound: true };
      }
      throw new Error('Failed to fetch tenant');
    }
    const tenant = await tenantRes.json();

    const queuesRes = await fetch(`${baseUrl}/queue/public/tenant/${tenant.id}`);
    const queues = queuesRes.ok ? await queuesRes.json() : [];

    return {
      props: {
        tenant,
        queues,
      },
    };
  } catch (error: any) {
    console.error('Error fetching tenant portal data:', error);
    return {
      props: {
        tenant: null,
        queues: [],
        error: 'Unable to load tenant information.',
      },
    };
  }
};

export default function TenantPortal({ tenant, queues, error }: TenantPortalProps) {
  if (error || !tenant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unavailable</h1>
          <p className="text-gray-500">{error || 'This portal is currently unavailable.'}</p>
        </div>
      </div>
    );
  }

  const primaryColor = tenant.branding?.primaryColor || '#4f46e5';
  const logoUrl = tenant.branding?.logoUrl;

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden flex flex-col">
      <Head>
        <title>{tenant.name} | Welcome</title>
      </Head>

      {/* Dynamic Theme Glow based on Tenant Primary Color */}
      <div 
        className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full mix-blend-multiply filter blur-[150px] pointer-events-none opacity-40 z-0"
        style={{ backgroundColor: primaryColor }}
      ></div>

      <header className="relative z-10 w-full max-w-4xl mx-auto p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt={tenant.name} className="w-10 h-10 object-contain" />
          ) : (
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-lg"
              style={{ backgroundColor: primaryColor }}
            >
              {tenant.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <span className="font-bold text-gray-900 tracking-tight text-xl">{tenant.name}</span>
        </div>
      </header>

      <main className="relative z-10 flex-1 w-full max-w-4xl mx-auto p-6 flex flex-col pt-12 md:pt-24">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight leading-tight">
            Welcome to <br />
            <span style={{ color: primaryColor }}>{tenant.name}</span>
          </h1>
          <p className="text-xl text-gray-500 mb-12 max-w-xl leading-relaxed">
            Please select the service you need today. Join the queue virtually and we'll notify you when it's your turn.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 max-w-3xl">
          {queues.length === 0 ? (
            <div className="col-span-2 p-8 text-center border-2 border-dashed border-gray-200 rounded-3xl bg-white/50">
              <p className="text-gray-500 font-medium">No active queues available at the moment.</p>
            </div>
          ) : (
            queues.map((queue) => (
              <Link 
                key={queue.id} 
                href={`/queue/${queue.id}`}
                className="group relative bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
              >
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300"
                  style={{ backgroundColor: primaryColor }}
                />
                
                <div className="flex items-start justify-between mb-8 relative z-10">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gray-50 text-gray-600 transition-colors duration-300 group-hover:text-white"
                    style={{ 
                      backgroundColor: 'transparent',
                    }}
                  >
                    <div className="absolute w-12 h-12 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ backgroundColor: primaryColor }} />
                    <MapPin className="w-5 h-5 relative z-10" />
                  </div>
                  <div className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center bg-white group-hover:border-transparent group-hover:shadow-md transition-all">
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-900 transition-colors" />
                  </div>
                </div>

                <div className="mt-auto relative z-10">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{queue.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    Open now
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
