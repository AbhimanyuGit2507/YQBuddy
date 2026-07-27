import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  ShieldAlert, 
  Building2, 
  CreditCard,
  Users,
  LogOut,
  Activity,
  Menu,
  X
} from 'lucide-react';

import { useTheme } from './ThemeProvider';
import { useAuth } from './AuthContext';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, logout, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0005]">
        <div className="w-8 h-8 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const navItems = [
    { label: 'Command Center', href: '/super-admin', icon: Activity },
    { label: 'Tenants & Businesses', href: '/super-admin/tenants', icon: Building2 },
    { label: 'Revenue & Billing', href: '/super-admin/billing', icon: CreditCard },
    { label: 'Global Users', href: '/super-admin/users', icon: Users },
  ];

  const isActive = (path: string) => {
    if (path === '/super-admin') {
      return router.pathname === '/super-admin';
    }
    return router.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0005] text-gray-900 dark:text-white flex overflow-hidden transition-colors font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 border-r border-rose-200 dark:border-rose-900/30 bg-white dark:bg-[#120005] flex flex-col transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-rose-200 dark:border-rose-900/30 transition-colors bg-rose-50 dark:bg-rose-950/20">
          <div className="flex items-center gap-3 text-rose-600 dark:text-rose-500">
            <ShieldAlert className="w-6 h-6" />
            <span className="font-bold text-lg tracking-wide uppercase">God Mode</span>
          </div>
          <button 
            className="lg:hidden p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/50"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          <p className="px-2 text-xs font-bold tracking-widest text-gray-400 dark:text-rose-900/80 uppercase mb-4">Super Admin</p>
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  active 
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 font-medium border border-rose-200 dark:border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)]' 
                    : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-rose-950/30 hover:text-gray-900 dark:hover:text-rose-300 border border-transparent'
                }`}
              >
                <item.icon className={`w-5 h-5 ${active ? 'text-rose-600 dark:text-rose-400' : 'text-gray-400 dark:text-zinc-500'}`} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen relative">
        {/* Subtle background glow for main area */}
        <div className="absolute top-0 -right-64 w-[600px] h-[600px] bg-rose-600/10 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none z-0"></div>

        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-8 border-b border-rose-200 dark:border-rose-900/30 bg-white/80 dark:bg-[#120005]/80 backdrop-blur-md z-10 shrink-0 transition-colors">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-gray-100 dark:bg-black/50 border border-gray-200 dark:border-rose-900/30 hover:bg-gray-200 dark:hover:bg-black/80 transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full bg-gray-100 dark:bg-black/50 flex items-center justify-center border border-gray-200 dark:border-rose-900/30 hover:bg-gray-200 dark:hover:bg-black/80 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <span className="text-zinc-400">☀️</span>
              ) : (
                <span className="text-gray-600">🌙</span>
              )}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-600 to-orange-500 flex items-center justify-center font-bold text-white shadow-[0_0_10px_rgba(225,29,72,0.4)]">
                SA
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-rose-100">Super Admin</span>
            </div>
            <button 
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className="w-8 h-8 rounded-full bg-gray-100 dark:bg-black/50 flex items-center justify-center border border-gray-200 dark:border-rose-900/30 hover:bg-gray-200 dark:hover:bg-black/80 transition-colors"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4 text-gray-500 dark:text-rose-400" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8 z-10 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
