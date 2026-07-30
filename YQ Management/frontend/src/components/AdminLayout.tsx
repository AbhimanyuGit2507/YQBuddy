import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  LayoutDashboard, 
  List, 
  Scan, 
  History, 
  QrCode, 
  Users, 
  Settings,
  LogOut,
  CreditCard,
  Menu,
  X,
  Bell,
  ChevronDown,
} from 'lucide-react';

import { useTheme } from './ThemeProvider';
import { DashboardTour } from './DashboardTour';
import { WhatsAppStatusIndicator } from './WhatsAppStatusIndicator';
import { useAuth } from './AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  pageSubtitle?: string;
}

export default function AdminLayout({ children, pageTitle, pageSubtitle }: AdminLayoutProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = user?.email ? user.email.substring(0, 2).toUpperCase() : '??';

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Queues', href: '/dashboard/queues', icon: List, id: 'tour-queues-nav' },
    { label: 'Scanner', href: '/dashboard/scanner', icon: Scan },
    { label: 'Analytics & Records', href: '/dashboard/history', icon: History },
    { label: 'QR Display', href: '/dashboard/display-picker', icon: QrCode },
  ];

  const bottomItems = [
    { label: 'Team Members', href: '/dashboard/settings/staff', icon: Users, adminOnly: true },
    { label: 'Billing & Plans', href: '/dashboard/settings/billing', icon: CreditCard, adminOnly: true },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings, id: 'tour-settings-nav', adminOnly: true },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return router.pathname === '/dashboard';
    }
    return router.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white flex overflow-hidden transition-colors">
      <DashboardTour />
      
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`w-64 border-r border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 flex flex-col z-20 shrink-0 transition-colors lg:translate-x-0 ${
        mobileOpen ? 'translate-x-0 fixed inset-y-0 left-0 shadow-2xl' : '-translate-x-full fixed'
      }`}>
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-white/10 transition-colors">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]">
              YQ
            </div>
            <span className="font-bold text-lg tracking-wide">Qmover</span>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="ml-auto lg:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                id={item.id}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  active
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 font-medium border border-indigo-200 dark:border-indigo-500/20'
                    : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white border border-transparent'
                }`}
              >
                <item.icon className={`w-5 h-5 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-zinc-500'}`} />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-white/10 space-y-1 transition-colors">
          {bottomItems.map((item) => {
            if (item.adminOnly && (!user || user.role !== 'TENANT_ADMIN')) return null;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                id={item.id}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  active
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 font-medium border border-indigo-200 dark:border-indigo-500/20'
                    : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white border border-transparent'
                }`}
              >
                <item.icon className={`w-5 h-5 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-zinc-500'}`} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen relative">
        {/* Subtle background glow for main area */}
        <div className="absolute top-0 -right-64 w-[500px] h-[500px] bg-indigo-600/10 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none z-0"></div>
        <div className="absolute bottom-0 -left-64 w-[500px] h-[500px] bg-purple-600/10 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none z-0"></div>

        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/50 backdrop-blur-md z-10 shrink-0 transition-colors">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            {(pageTitle || pageSubtitle) && (
              <div>
                {pageTitle && <h1 className="text-sm font-bold text-gray-900 dark:text-white">{pageTitle}</h1>}
                {pageSubtitle && <p className="text-xs text-gray-400 dark:text-zinc-500">{pageSubtitle}</p>}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <WhatsAppStatusIndicator />
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
            >
              {theme === 'dark' ? (
                <span className="text-zinc-400 text-sm">☀️</span>
              ) : (
                <span className="text-gray-600 text-sm">🌙</span>
              )}
            </button>
            <button className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors relative">
              <Bell className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs shadow-[0_0_8px_rgba(99,102,241,0.3)]">
                {initials}
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-zinc-300 hidden sm:block">{user?.email?.split('@')[0] || 'Operator'}</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </div>
            <button onClick={logout} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors" title="Log out">
              <LogOut className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 z-10 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
