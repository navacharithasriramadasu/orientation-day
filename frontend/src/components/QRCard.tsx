import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { Download, CheckCircle2, GraduationCap, ShieldCheck } from './Icons';
import { StatusBadge } from './StatusBadge';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Media } from '@capacitor-community/media';

interface QRCardProps {
  candidate: {
    studentId: string;
    name: string;
    program: string;
    college?: string;
    paymentStatus?: string;
  };
  event: {
    name: string;
  };
  token: string;
}

export const QRCard: React.FC<QRCardProps> = ({ candidate, event, token }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<boolean>(false);

  const collegeName =
    candidate.college ||
    (candidate.studentId.trim().startsWith('1608')
      ? 'Matrusri Engineering College'
      : 'MVSR Engineering College');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);

    try {
      const cardEl = cardRef.current;
      if (!cardEl) {
        showToast('Pass container not found.');
        setDownloading(false);
        return;
      }

      // 1. Capture exact pixel-perfect snapshot with html2canvas at 3x resolution
      const canvas = await html2canvas(cardEl, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0f172a',
        logging: false,
      });

      const fileName = `OrientationPass_${candidate.studentId.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      const dataUrl = canvas.toDataURL('image/png', 1.0);

      const isNative = Boolean(
        typeof window !== 'undefined' &&
        (window as any).Capacitor?.isNativePlatform?.()
      );

      // ── A. NATIVE CAPACITOR APP (ANDROID / IOS) ──
      if (isNative) {
        try {
          const base64Raw = dataUrl.split(',')[1];
          const savedFile = await Filesystem.writeFile({
            path: fileName,
            data: base64Raw,
            directory: Directory.Cache,
          });

          await Media.savePhoto({
            path: savedFile.uri,
            albumIdentifier: 'Orientation Passes',
          });

          showToast('✓ Saved snapshot to Photo Gallery!');
          setDownloading(false);
          return;
        } catch (nativeErr: any) {
          console.warn('[Native Save Warning, falling back to download]', nativeErr);
        }
      }

      // ── B. DIRECT INSTANT BROWSER DOWNLOAD (PC & MOBILE BROWSER) ──
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('✓ Saved snapshot of QR Pass!');
      setDownloading(false);
    } catch (err: any) {
      console.error('[Snapshot Download Error]', err);
      showToast('Error taking snapshot. Please screenshot your pass.');
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
      {/* ── Exact Pass Card Snapshot Target ── */}
      <div
        ref={cardRef}
        className="w-full bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-slate-100"
      >
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white leading-tight">{collegeName}</h3>
              <p className="text-xs text-emerald-400 font-medium">Orientation Day - 2026 Batch</p>
            </div>
          </div>
          <StatusBadge status="ELIGIBLE" />
        </div>

        {/* Candidate Details */}
        <div className="space-y-3 mb-5 bg-slate-900/60 rounded-2xl p-4 border border-slate-700/40">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
              Candidate Name
            </span>
            <span className="text-lg font-bold text-emerald-300 block leading-snug">
              {candidate.name}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
                Roll Number (User ID)
              </span>
              <span className="text-sm font-mono font-bold text-slate-200">
                {candidate.studentId}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
                Branch / Program
              </span>
              <span className="text-sm font-medium text-slate-200 truncate block">
                {candidate.program}
              </span>
            </div>
          </div>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center bg-white rounded-2xl p-5 shadow-inner mb-5">
          <QRCodeSVG value={token} size={200} level="H" includeMargin={false} />
          <div className="flex items-center gap-1.5 mt-3 text-slate-500 text-[11px] font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified Orientation Pass</span>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1 mb-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Valid for Orientation Day Entrance Verification</span>
        </div>
      </div>

      {/* Download Action Button */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="w-full bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
      >
        {downloading ? (
          <>
            <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            <span>Capturing Snapshot...</span>
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            <span>Save QR Pass Snapshot to Gallery</span>
          </>
        )}
      </button>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 z-50 bg-slate-900/95 border border-emerald-500/50 text-emerald-300 px-5 py-3 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
