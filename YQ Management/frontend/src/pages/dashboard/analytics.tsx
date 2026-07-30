import React, { useState } from 'react';
import Head from 'next/head';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../../lib/api';
import AdminLayout from '../../components/AdminLayout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Clock, Users, XCircle, Download, Star, Timer } from 'lucide-react';

export default function AnalyticsDashboard() {
  const [timeframe, setTimeframe] = useState('today');

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', timeframe],
    queryFn: () => fetchApi(`/analytics?timeframe=${timeframe}`),
    refetchInterval: 60000, // refresh every minute
  });

  const exportCsv = () => {
    if (!data?.chartData) return;
    const headers = ['Time Label', 'Volume', 'Avg Wait Time (mins)'];
    const rows = data.chartData.map((d: any) => `${d.timeLabel},${d.volume},${d.avgWaitTime}`);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `analytics_${timeframe}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <AdminLayout pageTitle="Analytics" pageSubtitle="Queue performance and insights">
      <Head>
        <title>Analytics | YQ Dashboard</title>
      </Head>

      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
            <p className="text-gray-500 dark:text-zinc-400 mt-2">Monitor your queue performance and drop-off rates.</p>
          </div>
          <div className="flex items-center gap-4">
            <select 
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>

            <button 
              onClick={exportCsv}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Total Served</p>
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{data?.kpis?.totalServed || 0}</h3>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Avg Wait Time</p>
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{data?.kpis?.averageWaitTimeMins || 0}m</h3>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl">
                    <Timer className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Service Time</p>
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{data?.kpis?.averageServiceTimeMins || 0}m</h3>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-2xl">
                    <Star className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">CSAT Score</p>
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{data?.kpis?.csatScore || 0}</h3>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Drop-off Rate</p>
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{data?.kpis?.dropOffRate || 0}%</h3>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart Area */}
            <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Volume & Wait Times</h3>
                  <p className="text-sm text-gray-500 dark:text-zinc-400">Total customers and average wait time (minutes)</p>
                </div>
                <Activity className="w-5 h-5 text-gray-400" />
              </div>
              
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data?.chartData || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis 
                      dataKey="timeLabel" 
                      stroke="#888" 
                      fontSize={12} 
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#888" 
                      fontSize={12} 
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px', color: '#fff' }}
                      itemStyle={{ color: '#818cf8' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="volume" 
                      name="Volume"
                      stroke="#6366f1" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avgWaitTime" 
                      name="Wait Time (m)"
                      stroke="#10b981" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
