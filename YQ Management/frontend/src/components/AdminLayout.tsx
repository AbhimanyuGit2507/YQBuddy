import React, { useState, useRef, useEffect } from 'react';
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
  ChevronDown,
  User as UserIcon,
  UserCog,
  Menu,
  X
} from 'lucide-react';

import { useTheme } from './ThemeProvider';
import { DashboardTour } from './DashboardTour';
import { WhatsAppStatusIndicator } from './WhatsAppStatusIndicator';
import { useAuth } from './AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || '';

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, logout, loading } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Queues', href: '/dashboard/queues', icon: List, id: 'tour-queues-nav' },
    { label: 'Scanner', href: '/dashboard/scanner', icon: Scan },
    { label: 'Analytics & Records', href: '/dashboard/history', icon: History },
    { label: 'QR Display', href: '/dashboard/display-picker', icon: QrCode },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return router.pathname === '/dashboard';
    }
    return router.pathname.startsWith(path);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getUserInitials = () => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white flex overflow-hidden transition-colors">
      <DashboardTour />
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 border-r border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 flex flex-col transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-white/10 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]">
              YQ
            </div>
            <span className="font-bold text-lg tracking-wide">Qmover</span>
          </div>
          <button 
            className="lg:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
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
          {isSuperAdmin && (
            <Link 
              href="/dashboard/settings/staff" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive('/dashboard/settings/staff')
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 font-medium border border-indigo-200 dark:border-indigo-500/20' 
                  : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white border border-transparent'
              }`}
            >
              <Users className={`w-5 h-5 ${isActive('/dashboard/settings/staff') ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-zinc-500'}`} />
              User Management
            </Link>
          )}
          {isSuperAdmin && (
            <Link 
              href="/dashboard/settings" 
              id="tour-settings-nav"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive('/dashboard/settings')
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 font-medium border border-indigo-200 dark:border-indigo-500/20' 
                  : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white border border-transparent'
              }`}
            >
              <Settings className={`w-5 h-5 ${isActive('/dashboard/settings') ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-zinc-500'}`} />
              Settings
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen relative">
        {/* Subtle background glow for main area */}
        <div className="absolute top-0 -right-64 w-[500px] h-[500px] bg-indigo-600/10 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none z-0"></div>
        <div className="absolute bottom-0 -left-64 w-[500px] h-[500px] bg-purple-600/10 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none z-0"></div>

        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-8 border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/50 backdrop-blur-md z-[100] shrink-0 transition-colors">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-xl bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
              aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
          <div className="flex items-center gap-4">
            <WhatsAppStatusIndicator />
            <button 
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <span className="text-zinc-400">☀️</span>
              ) : (
                <span className="text-gray-600">🌙</span>
              )}
            </button>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-3 pl-2 pr-1.5 py-1.5 rounded-xl bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                  {getUserInitials()}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-zinc-200 max-w-[120px] truncate">
                  {user?.email?.split('@')[0] || 'Operator'}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-500 dark:text-zinc-400 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-white/10">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.email || 'operator@qmover.com'}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{isSuperAdmin ? 'Super Administrator' : 'Operator'}</p>
                  </div>
                  <div className="py-1.5">
                    <Link 
                      href="/dashboard/settings" 
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <UserIcon className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
                      Settings
                    </Link>
                    {isSuperAdmin && (
                      <Link 
                        href="/dashboard/settings?tab=billing" 
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <CreditCard className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
                        Plans & Billing
                      </Link>
                    )}
                    {isSuperAdmin && (
                      <Link 
                        href="/dashboard/settings/staff" 
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <Users className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
                        User Management
                      </Link>
                    )}
                  </div>
                  <div className="border-t border-gray-200 dark:border-white/10 py-1.5">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
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
