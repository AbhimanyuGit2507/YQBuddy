import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AdminLayout from './AdminLayout';
import { Settings, MessageSquare, Users, CreditCard, Webhook } from 'lucide-react';
import { useAuth } from './AuthContext';

interface SettingsLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  pageSubtitle?: string;
}

export default function SettingsLayout({ children, pageTitle = 'Settings', pageSubtitle = 'Manage your workspace preferences' }: SettingsLayoutProps) {
  const router = useRouter();
  const { user } = useAuth();
  
  // Only admins can see all settings
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'TENANT_ADMIN';

  const settingsTabs = [
    { label: 'General', href: '/dashboard/settings', icon: Settings, adminOnly: false },
    { label: 'WhatsApp API', href: '/dashboard/settings/whatsapp', icon: MessageSquare, adminOnly: true },
    { label: 'Staff & Invitations', href: '/dashboard/settings/staff', icon: Users, adminOnly: true },
    { label: 'Webhooks', href: '/dashboard/settings/webhooks', icon: Webhook, adminOnly: true },
    { label: 'Billing & Plans', href: '/dashboard/settings/billing', icon: CreditCard, adminOnly: true },
  ];

  // Filter tabs based on role
  const visibleTabs = settingsTabs.filter(tab => !tab.adminOnly || isAdmin);

  const isActive = (href: string) => {
    if (href === '/dashboard/settings') {
      return router.pathname === '/dashboard/settings';
    }
    return router.pathname === href;
  };

  return (
    <AdminLayout pageTitle={pageTitle} pageSubtitle={pageSubtitle}>
      <div className="flex flex-col md:flex-row gap-6 lg:gap-8 max-w-7xl mx-auto h-full min-h-[calc(100vh-120px)] p-4 sm:p-6 lg:p-8">
        
        {/* Secondary Sidebar for Settings */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-2 sticky top-24">
            <nav className="flex flex-col gap-1">
              {visibleTabs.map((tab) => {
                const active = isActive(tab.href);
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                      active 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800/50 hover:text-gray-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    <tab.icon className={`w-5 h-5 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-zinc-500'}`} />
                    {tab.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content Area */}
        <div className="flex-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 lg:p-8 shadow-sm h-fit">
          {children}
        </div>
      </div>
    </AdminLayout>
  );
}
