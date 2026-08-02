import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import SettingsLayout from '../../../components/SettingsLayout';
import { Save, UserCog, Loader2 } from 'lucide-react';
import { useAuth } from '../../../components/AuthContext';
import { fetchApi } from '../../../lib/api';
import { toast } from 'sonner';

export default function GeneralSettingsPage() {
  const { user, refetch } = useAuth();
  const [language, setLanguage] = useState('en');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [tenantName, setTenantName] = useState('');
  const [tenantPrimaryColor, setTenantPrimaryColor] = useState('#4f46e5');

  useEffect(() => {
    if (user?.personalSettings?.language) {
      setLanguage(user.personalSettings.language);
    }
    if (user?.personalSettings?.notificationsEnabled !== undefined) {
      setNotificationsEnabled(user.personalSettings.notificationsEnabled);
    }
  }, [user]);

  useEffect(() => {
    // Fetch tenant details to prepopulate tenant name and primary color
    if (user?.tenantId) {
      fetchApi('/tenant').then((res) => {
        if (res && res.length > 0) {
          // Assuming the user is part of a single active tenant for now
          const currentTenant = res.find((t: any) => t.id === user.tenantId) || res[0];
          setTenantName(currentTenant.name || '');
          setTenantPrimaryColor(currentTenant.branding?.primaryColor || '#4f46e5');
        }
      }).catch(err => console.error("Failed to fetch tenant details:", err));
    }
  }, [user]);

  const savePersonalSettings = async () => {
    setSavingPersonal(true);
    try {
      // 1. Save User Personal Settings
      await fetchApi('/auth/personal-settings', {
        method: 'PATCH',
        body: JSON.stringify({
          language,
          notificationsEnabled,
        }),
      });

      // 2. Save Tenant Branding/Name if the user is an admin
      if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'TENANT_ADMIN') {
        if (user.tenantId) {
          await fetchApi(`/tenant/${user.tenantId}`, { 
            method: 'PATCH', 
            body: JSON.stringify({ name: tenantName, branding: { primaryColor: tenantPrimaryColor } }) 
          });
        }
      }

      await refetch();
      toast.success('Settings saved successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSavingPersonal(false);
    }
  };

  return (
    <SettingsLayout pageTitle="General Settings" pageSubtitle="Manage your profile and display preferences">
      <Head>
        <title>General Settings | Qmova</title>
      </Head>

      <div className="space-y-8 max-w-3xl">
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
              <UserCog className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Workspace Configuration</h2>
          </div>

          <div className="space-y-6">
            <div className="grid gap-6 p-6 border border-gray-200 dark:border-zinc-800 rounded-2xl bg-gray-50/50 dark:bg-zinc-800/20">
              
              <div className="space-y-4 border-b border-gray-200 dark:border-zinc-800 pb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">Workspace / Company Name</label>
                  <input
                    type="text"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                    placeholder="E.g. Acme Corp"
                  />
                  <p className="text-sm text-gray-500 dark:text-zinc-500 mt-2">This is the name your customers will see on the queue portal.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">Brand Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={tenantPrimaryColor}
                      onChange={(e) => setTenantPrimaryColor(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                    />
                    <span className="text-sm font-mono text-gray-600 dark:text-zinc-400">{tenantPrimaryColor}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">Interface Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="ar">العربية</option>
                  <option value="hi">हिन्दी</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer p-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl hover:border-gray-300 dark:hover:border-zinc-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <span className="block text-sm font-medium text-gray-900 dark:text-zinc-100">In-App Notifications</span>
                    <span className="block text-sm text-gray-500 dark:text-zinc-500 mt-1">Receive alerts when someone joins your queue or sends a message.</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-zinc-800">
          <button
            onClick={savePersonalSettings}
            disabled={savingPersonal}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-white font-medium rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            {savingPersonal ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Changes
          </button>
        </div>
      </div>
    </SettingsLayout>
  );
}
