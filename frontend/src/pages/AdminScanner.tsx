import React, { useState } from 'react';
import { QRScanner } from '../components/QRScanner';
import { api } from '../services/api';
import { ScanResponse } from '../types';
import { ShieldCheck, LogIn, CheckCircle2 } from '../components/Icons';

export const AdminScanner: React.FC = () => {
  const [scanCount, setScanCount] = useState<number>(0);

  const handleScanResult = async (token: string): Promise<ScanResponse> => {
    const res = await api.scanToken(token, 'attendance');
    if (res.status === 'SUCCESS') {
      setScanCount((prev) => prev + 1);
    }
    return res;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="w-full max-w-xl mx-auto space-y-5">

        {/* Header Title */}
        <div className="text-center space-y-1">
          <span className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-semibold inline-flex items-center gap-1.5 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live QR Scanner Checkpoint
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight pt-1">
            Entrance Verification & Attendance
          </h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Scans student QR pass for Orientation Day entrance. Duplicate entries are automatically blocked.
          </p>
        </div>

        {/* Active Checkpoint Banner with Session Counter */}
        <div className="p-3.5 rounded-2xl border bg-emerald-500/10 border-emerald-500/25 text-emerald-300 text-xs font-medium flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <LogIn className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-emerald-200 block text-xs">Orientation Day Entrance Gate</strong>
              <span className="text-[11px] text-emerald-300/80">Verifies and logs candidate attendance in real-time</span>
            </div>
          </div>
          <div className="text-right shrink-0 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/20">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Scans This Session</span>
            <span className="text-base font-black text-emerald-400 font-mono">{scanCount}</span>
          </div>
        </div>

        {/* Live Camera Scanner Viewport */}
        <QRScanner
          key="orientation-entrance-scanner"
          onScanResult={handleScanResult}
          autoResetDelayMs={2500}
        />

        <p className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Real-time database validation · Duplicate rescans automatically rejected.</span>
        </p>

      </div>
    </div>
  );
};

