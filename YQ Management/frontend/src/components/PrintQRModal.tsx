import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, Check } from 'lucide-react';

interface Queue {
  id: string;
  name: string;
  status: string;
}

interface PrintQRModalProps {
  open: boolean;
  onClose: () => void;
  queues: Queue[];
}

export default function PrintQRModal({ open, onClose, queues }: PrintQRModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [printMode, setPrintMode] = useState<'selected' | 'all'>('all');

  useEffect(() => {
    if (open) {
      setSelectedIds(new Set());
      setPrintMode('all');
    }
  }, [open]);

  const toggleQueue = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (printMode === 'all') return;
    setSelectedIds(new Set(queues.map(q => q.id)));
    setPrintMode('all');
  };

  const handlePrint = () => {
    const idsToPrint = printMode === 'all' ? queues.map(q => q.id) : Array.from(selectedIds);
    if (idsToPrint.length === 0) return;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    const queuesToPrint = queues.filter(q => idsToPrint.includes(q.id));
    const baseUrl = window.location.origin;

    const qrHtml = queuesToPrint.map(queue => `
      <div class="qr-item">
        <div class="qr-code">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(baseUrl + '/customer/join/' + queue.id)}" alt="QR for ${queue.name}" />
        </div>
        <div class="queue-name">${queue.name}</div>
        <div class="queue-url">${baseUrl}/join/${queue.id}</div>
      </div>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print QR Codes</title>
          <style>
            @page { margin: 0.5cm; size: A4; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { font-size: 24px; margin-bottom: 8px; }
            .header p { color: #666; font-size: 14px; }
            .qr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 24px; }
            .qr-item { border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; text-align: center; page-break-inside: avoid; }
            .qr-code img { width: 200px; height: 200px; display: block; margin: 0 auto 12px; }
            .queue-name { font-size: 16px; font-weight: bold; margin-bottom: 4px; color: #111; }
            .queue-url { font-size: 12px; color: #666; word-break: break-all; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .qr-item { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Queue QR Codes</h1>
            <p>Printed on ${new Date().toLocaleDateString()}</p>
          </div>
          <div class="qr-grid">
            ${qrHtml}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  if (!open) return null;

  const activeQueues = queues.filter(q => q.status === 'ACTIVE');

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Print QR Codes</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Select queues to print QR codes for customer join links.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-zinc-400" />
          </button>
        </div>

        <div className="p-6 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="printMode"
                checked={printMode === 'all'}
                onChange={() => setPrintMode('all')}
                className="w-4 h-4 text-indigo-600"
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white">All Active Queues ({activeQueues.length})</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="printMode"
                checked={printMode === 'selected'}
                onChange={() => setPrintMode('selected')}
                className="w-4 h-4 text-indigo-600"
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Selected Queues</span>
            </label>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {printMode === 'all' ? (
            <div className="space-y-3">
              {queues.map(queue => (
                <div key={queue.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${queue.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{queue.name}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">Status: {queue.status}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-zinc-500">{window.location.origin}/join/{queue.id}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {queues.map(queue => (
                <label
                  key={queue.id}
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${
                    selectedIds.has(queue.id)
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                      : 'border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800/50 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(queue.id)}
                      onChange={() => toggleQueue(queue.id)}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{queue.name}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">Status: {queue.status}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-zinc-500">{window.location.origin}/join/{queue.id}</span>
                </label>
              ))}
              {queues.length > 0 && (
                <button
                  onClick={selectAll}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mt-2"
                >
                  Select all
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            disabled={printMode === 'selected' && selectedIds.size === 0}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer className="w-4 h-4" />
            Print QR Codes
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
