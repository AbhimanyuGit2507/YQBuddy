import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function AdminScanner() {
  const [scanResult, setScanResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    let scanner: Html5QrcodeScanner;
    
    if (isScanning) {
      scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      
      scanner.render(async (decodedText) => {
        // Stop scanning after successful read
        scanner.clear();
        setIsScanning(false);
        
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/token/validate`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}` // assuming JWT is stored
            },
            body: JSON.stringify({ tokenId: decodedText })
          });
          
          const result = await res.json();
          setScanResult(result);
        } catch (e) {
          console.error(e);
          setScanResult({ valid: false, status: 'Error', reason: 'Failed to validate' });
        }
      }, (error) => {
        // ignore scan errors
      });
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(e => console.error(e));
      }
    };
  }, [isScanning]);

  const resetScanner = () => {
    setScanResult(null);
    setIsScanning(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-12">
      <Head>
        <title>QR Scanner - YQ Admin</title>
      </Head>
      <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Scan Customer QR</h1>
        
        {isScanning && (
          <div id="reader" className="w-full"></div>
        )}

        {scanResult && (
          <div className={`p-6 rounded-lg text-center mt-4 ${scanResult.valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <h2 className="text-3xl font-bold">{scanResult.status}</h2>
            <p className="mt-2 text-lg">{scanResult.valid ? 'Valid Token - Allow Customer' : `Invalid: ${scanResult.reason}`}</p>
            
            <button 
              onClick={resetScanner}
              className="mt-6 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
            >
              Scan Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
