import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { io } from 'socket.io-client';

export default function TVDisplay() {
  const router = useRouter();
  const { tenantId } = router.query;
  const [calledTokens, setCalledTokens] = useState<any[]>([]);

  useEffect(() => {
    if (!tenantId) return;

    const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000');
    
    socket.emit('joinTenantRoom', tenantId);

    socket.on('token_serving', (data) => {
      // Add to list and play sound
      const token = data.token || data;
      setCalledTokens(prev => [token, ...prev].slice(0, 5)); // Keep last 5
      
      // Attempt to play a simple web audio beep if use-sound isn't configured with an mp3
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
        oscillator.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.5);
      } catch {
        // audio not supported
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [tenantId]);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 flex flex-col">
      <Head><title>Queue Display</title></Head>
      
      <header className="flex justify-between items-center mb-12 border-b border-slate-700 pb-6">
        <h1 className="text-4xl font-bold text-slate-300">Now Serving</h1>
      </header>

      <main className="flex-1 grid grid-cols-2 gap-8">
        <div className="col-span-1">
          {calledTokens.length > 0 ? (
            <div className="bg-blue-600 rounded-3xl p-12 text-center animate-pulse shadow-[0_0_50px_rgba(37,99,235,0.5)]">
              <p className="text-3xl text-blue-200 mb-4 tracking-widest uppercase">Token Number</p>
              <p className="text-8xl font-black mb-8">{calledTokens[0].id.substring(0,4).toUpperCase()}</p>
              <p className="text-4xl font-bold bg-white/20 inline-block px-8 py-4 rounded-full">Please proceed to Counter</p>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center border-4 border-dashed border-slate-700 rounded-3xl">
              <p className="text-3xl text-slate-500">Waiting for next customer...</p>
            </div>
          )}
        </div>

        <div className="col-span-1 bg-slate-800 rounded-3xl p-8">
          <h2 className="text-2xl text-slate-400 font-bold mb-6 uppercase tracking-wider">Recently Called</h2>
          <div className="space-y-4">
            {calledTokens.slice(1).map((t, idx) => (
              <div key={idx} className="bg-slate-700/50 p-6 rounded-2xl flex justify-between items-center text-3xl font-mono">
                <span className="text-slate-300">{t.id.substring(0,4).toUpperCase()}</span>
                <span className="text-blue-400">Proceed</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
