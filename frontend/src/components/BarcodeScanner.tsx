'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Camera } from 'lucide-react';

interface Props {
  onScan: (value: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<{ clear: () => void } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function startScanner() {
      try {
        // Dynamically import to avoid SSR issues
        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelled || !containerRef.current) return;

        const scannerId = 'barcode-scanner-container';
        const scanner = new Html5Qrcode(scannerId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 120 } },
          (decodedText) => {
            if (cancelled) return;
            // Browser push notification
            if (typeof window !== 'undefined' && 'Notification' in window) {
              if (Notification.permission === 'granted') {
                new Notification('Barcode scanned', {
                  body: decodedText,
                  icon: '/favicon.ico',
                });
              }
            }
            onScan(decodedText);
          },
          () => {
            // Ignore decode errors (frames without a barcode)
          }
        );
        if (!cancelled) setReady(true);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Camera access denied or not available'
          );
        }
      }
    }

    // Request notification permission opportunistically
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }

    startScanner();

    return () => {
      cancelled = true;
      try { scannerRef.current?.clear(); } catch { /* ignore */ }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-indigo-600" />
            <h2 className="font-semibold text-gray-900">Scan Barcode</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close scanner"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative bg-black" style={{ minHeight: 240 }}>
          <div id="barcode-scanner-container" ref={containerRef} className="w-full" />
          {!ready && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white text-sm">Starting camera…</p>
            </div>
          )}
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        <p className="text-center text-xs text-gray-400 px-4 py-3">
          Point the camera at a barcode or QR code
        </p>
      </div>
    </div>
  );
}
