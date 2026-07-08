import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { io } from 'socket.io-client';
import { Play, SkipForward, CheckCircle } from 'lucide-react';

export default function AdminDashboard() {
  const [tokens, setTokens] = useState<any[]>([]);
  const tenantId = "mock-tenant-id"; // In reality, fetched from JWT
  const queueId = "mock-queue-id"; 

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000');
    socket.emit('joinQueueRoom', queueId);

    // MOCK initial data load
    setTokens([
      { id: '123', customerName: 'John Doe', status: 'WAITING' },
      { id: '124', customerName: 'Jane Smith', status: 'WAITING' },
    ]);

    socket.on('token_joined', (data) => {
      setTokens(prev => [...prev, data.token]);
    });

    socket.on('token_serving', (data) => {
      setTokens(prev => prev.map(t => t.id === data.token.id ? data.token : t));
    });

    socket.on('token_completed', (data) => {
      setTokens(prev => prev.filter(t => t.id !== data.tokenId));
    });

    socket.on('token_missed', (data) => {
      setTokens(prev => prev.filter(t => t.id !== data.tokenId));
    });

    return () => {
      socket.disconnect();
    }
  }, []);

  const advanceQueue = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/queue/${queueId}/advance`, {
        method: 'POST'
      });
    } catch (e) {
      console.error(e);
    }
  };

  const completeToken = async (tokenId: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/queue/token/${tokenId}/complete`, {
        method: 'POST'
      });
    } catch (e) {
      console.error(e);
    }
  };

  const skipToken = async (tokenId: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/queue/token/${tokenId}/skip`, {
        method: 'POST'
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head><title>Operator Dashboard - YQ</title></Head>
      <nav className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold tracking-wider">YQ Operator</h1>
        <div className="flex items-center space-x-4">
          <span className="px-3 py-1 bg-blue-600 rounded-full text-sm font-medium">Counter 3</span>
          <button className="text-slate-300 hover:text-white">Logout</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-6 grid grid-cols-3 gap-8">
        
        {/* Active Queue Controls */}
        <div className="col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">General Queue</h2>
              <p className="text-gray-500">Currently serving and waiting customers.</p>
            </div>
            <button 
              onClick={advanceQueue}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg transition-transform active:scale-95"
            >
              <Play size={20} fill="currentColor" />
              <span>Call Next Customer</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tokens.map((token) => (
                  <tr key={token.id} className={token.status === 'SERVING' ? 'bg-blue-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">
                      {token.id.substring(0,6).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {token.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        token.status === 'SERVING' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {token.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {token.status === 'SERVING' ? (
                         <button onClick={() => completeToken(token.id)} className="text-green-600 hover:text-green-900 flex items-center justify-end w-full space-x-1">
                           <CheckCircle size={16} /> <span>Complete</span>
                         </button>
                      ) : (
                        <button onClick={() => skipToken(token.id)} className="text-red-600 hover:text-red-900 flex items-center justify-end w-full space-x-1">
                          <SkipForward size={16} /> <span>Skip</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {tokens.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No customers in queue.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Analytics Sidebar */}
        <div className="col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Live Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-sm text-gray-500">Waiting</p>
                <p className="text-3xl font-black text-gray-900">{tokens.filter(t=>t.status==='WAITING').length}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-sm text-gray-500">Avg Wait</p>
                <p className="text-3xl font-black text-gray-900">12<span className="text-sm font-medium">m</span></p>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
