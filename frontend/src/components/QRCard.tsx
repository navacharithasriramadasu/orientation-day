import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { Download, CheckCircle2, GraduationCap, ShieldCheck } from './Icons';
import { StatusBadge } from './StatusBadge';

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

  const collegeName = candidate.college || 'MVSR Engineering College';

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

      // Capture high-res snapshot
      const canvas = await html2canvas(cardEl, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0f172a',
        logging: false,
      });

      const fileName = `OrientationPass_${candidate.studentId.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      const dataUrl = canvas.toDataURL('image/png', 1.0);

      // ── NATIVE CAPACITOR (Android / iOS app) ──
      const isNative = Boolean(
        typeof window !== 'undefined' &&
        (window as any).Capacitor?.isNativePlatform?.()
      );

      if (isNative) {
        try {
          const { Filesystem, Directory } = await import('@capacitor/filesystem');
          const { Media } = await import('@capacitor-community/media');
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
          showToast('✓ Saved to Photo Gallery!');
          setDownloading(false);
          return;
        } catch (nativeErr: any) {
          console.warn('[Native Save Warning, falling back]', nativeErr);
        }
      }

      // ── MOBILE BROWSER: Use fetch + blob + object URL for gallery save ──
      // This triggers the "Save image" flow on Android Chrome / iOS Safari
      try {
        const blob = await (await fetch(dataUrl)).blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = fileName;
        link.href = blobUrl;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 500);
        showToast('✓ QR Pass saved! Check your Downloads / Gallery.');
      } catch {
        // Final fallback
        const link = document.createElement('a');
        link.download = fileName;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('✓ QR Pass download started!');
      }

      setDownloading(false);
    } catch (err: any) {
      console.error('[Snapshot Download Error]', err);
      showToast('Error saving. Please screenshot your pass manually.');
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto px-1">
      {/* ── Pass Card (snapshot target) ── */}
      <div
        ref={cardRef}
        className="w-full bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 border border-indigo-500/30 rounded-3xl p-5 shadow-2xl relative overflow-hidden text-slate-100"
      >
        {/* Background glows */}
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-3 mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-white leading-tight truncate">{collegeName}</h3>
              <p className="text-[11px] text-emerald-400 font-medium">Orientation Day - 2026 Batch</p>
            </div>
          </div>
          <div className="shrink-0 ml-2">
            <StatusBadge status="ELIGIBLE" />
          </div>
        </div>

        {/* Candidate Details */}
        <div className="space-y-2.5 mb-4 bg-slate-900/60 rounded-2xl p-3.5 border border-slate-700/40">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
              Candidate Name
            </span>
            <span className="text-base font-bold text-emerald-300 block leading-snug">
              {candidate.name}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-0.5">
            <div className="min-w-0">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
                Roll Number
              </span>
              <span className="text-xs font-mono font-bold text-slate-200 break-all">
                {candidate.studentId}
              </span>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
                Branch
              </span>
              <span className="text-xs font-medium text-slate-200 block truncate">
                {candidate.program}
              </span>
            </div>
          </div>
        </div>

        {/* QR Code — large and centered */}
        <div className="flex flex-col items-center justify-center bg-white rounded-2xl p-4 shadow-inner mb-4">
          <QRCodeSVG value={token} size={220} level="H" includeMargin={false} />
          <div className="flex items-center gap-1.5 mt-2.5 text-slate-500 text-[11px] font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified Orientation Pass</span>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Valid for Orientation Day Entrance Verification</span>
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="w-full bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 active:scale-[0.97] text-slate-950 font-bold py-4 px-6 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 text-sm"
      >
        {downloading ? (
          <>
            <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            <span>Saving to Gallery...</span>
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            <span>Save QR Pass to Gallery</span>
          </>
        )}
      </button>

      <p className="text-[11px] text-slate-500 text-center px-2">
        Tap the button above to download your QR pass directly to your phone gallery / downloads.
      </p>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-4 right-4 z-50 bg-slate-900/95 border border-emerald-500/50 text-emerald-300 px-5 py-3 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
