import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { QRCodeSVG } from 'qrcode.react';
import { io } from 'socket.io-client';

export default function CustomerWaitScreen() {
  const router = useRouter();
  const { id } = router.query;
  const tokenId = (router.query.tokenId as string) || "";

  const [position, setPosition] = useState(5);
  const [ewt, setEwt] = useState(25);
  const [status, setStatus] = useState('WAITING');

  useEffect(() => {
    if (!id) return;

    const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000');
    socket.emit('joinQueueRoom', id as string);

    socket.on('token_serving', (data) => {
      const token = data.token || data;
      if (token.id === tokenId) {
        setStatus('SERVING');
      } else {
        // Decrease position logically
        setPosition(prev => Math.max(1, prev - 1));
        setEwt(prev => Math.max(0, prev - 5)); // Assuming 5 min avg
      }
    });

    socket.on('token_completed', (data) => {
      if (data.tokenId === tokenId) {
        setStatus('COMPLETED');
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [id, tokenId]);

  if (status === 'COMPLETED') {
    return (
      <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-bold text-green-700 mb-4">Service Complete!</h1>
        <p className="text-xl text-green-600 mb-8">Thank you for visiting. Please leave us a review.</p>
        <button className="bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg">Leave Feedback</button>
      </div>
    );
  }

  if (status === 'SERVING') {
    return (
      <div className="min-h-screen bg-blue-600 flex flex-col items-center justify-center p-6 text-center text-white">
        <h1 className="text-5xl font-black mb-4 animate-bounce">It's your turn!</h1>
        <p className="text-2xl mb-8">Please proceed to Counter 3</p>
        <div className="bg-white p-8 rounded-3xl">
           <QRCodeSVG value={tokenId} size={200} />
        </div>
        <p className="mt-8 text-blue-200">Show this QR to the operator</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-6">
      <Head><title>Your Token - Qmova</title></Head>
      
      <header className="text-center py-6">
        <h1 className="text-2xl font-bold text-gray-900">General Consultation</h1>
        <p className="text-gray-500">Live Status</p>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center space-y-8">
        
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 flex flex-col items-center">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Your QR Ticket</p>
          <QRCodeSVG value={tokenId} size={200} />
          <p className="mt-4 font-mono font-bold text-gray-800 tracking-widest">{tokenId.substring(0,6).toUpperCase()}</p>
        </div>

        <div className="w-full max-w-sm grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
             <p className="text-gray-500 text-sm font-medium mb-1">People Ahead</p>
             <p className="text-4xl font-black text-blue-600">{position}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
             <p className="text-gray-500 text-sm font-medium mb-1">Est. Wait</p>
             <p className="text-4xl font-black text-gray-900">{ewt}<span className="text-lg font-medium text-gray-500">min</span></p>
          </div>
        </div>

        <div className="w-full max-w-sm bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800 text-center">
          <p>We'll notify you on WhatsApp when you are next.</p>
        </div>
      </main>

    </div>
  );
}
