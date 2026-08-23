import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Volume2, VolumeX, RefreshCw, CheckCircle2, AlertTriangle, XCircle, ShieldAlert } from './Icons';
import { ScanResponse } from '../types';
import { soundSynth } from './AudioFeedback';

interface QRScannerProps {
  onScanResult: (token: string) => Promise<ScanResponse>;
  autoResetDelayMs?: number;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  onScanResult,
  autoResetDelayMs = 2500,
}) => {
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [autoResetTimer, setAutoResetTimer] = useState<number | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'qr-reader-viewport';

  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          const formatted = devices.map((d) => ({
            id: d.id,
            label: d.label || `Camera ${d.id.slice(0, 5)}`,
          }));
          setCameras(formatted);
          const backCam = formatted.find((c) => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('environment'));
          setSelectedCameraId(backCam ? backCam.id : formatted[0].id);
        } else {
          setCameraError('No camera devices detected on this device.');
        }
      })
      .catch((err) => {
        setCameraError(
          'Camera access is required to scan Orientation Day QR codes. Please allow camera access in your settings and try again.'
        );
      });

    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async (cameraId: string) => {
    if (!cameraId) return;
    setCameraError(null);
    try {
      if (scannerRef.current) {
        await stopScanner();
      }

      const html5Qrcode = new Html5Qrcode(readerElementId);
      scannerRef.current = html5Qrcode;

      await html5Qrcode.start(
        cameraId,
        {
          fps: 10,
        },
        onQrCodeScanned,
        () => { }
      );

      setIsScanning(true);
    } catch (err: any) {
      setCameraError(
        'Camera access denied or device busy. Please ensure HTTPS context and camera permissions.'
      );
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner', err);
      }
    }
    setIsScanning(false);
  };

  const onQrCodeScanned = async (decodedText: string) => {
    if (isProcessing || scanResult) return;

    setIsProcessing(true);
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        scannerRef.current.pause(true);
      } catch (e) { }
    }

    try {
      const response = await onScanResult(decodedText);
      setScanResult(response);
      soundSynth.playSoundForStatus(response.status, soundEnabled);

      let countdown = Math.ceil(autoResetDelayMs / 1000);
      setAutoResetTimer(countdown);

      const interval = setInterval(() => {
        countdown -= 1;
        if (countdown >= 0) {
          setAutoResetTimer(countdown);
        } else {
          clearInterval(interval);
        }
      }, 1000);

      setTimeout(() => {
        clearInterval(interval);
        resetScanState();
      }, autoResetDelayMs);
    } catch (err) {
      console.error('Scan error', err);
      resetScanState();
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScanState = () => {
    setScanResult(null);
    setAutoResetTimer(null);
    if (scannerRef.current) {
      try {
        scannerRef.current.resume();
      } catch (e) { }
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto space-y-5">
      <div className="w-full bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 border border-slate-700 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Camera className="w-5 h-5 text-emerald-400 shrink-0" />
          <select
            value={selectedCameraId}
            onChange={(e) => {
              setSelectedCameraId(e.target.value);
              if (isScanning) startScanner(e.target.value);
            }}
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            {cameras.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {!isScanning ? (
            <button
              onClick={() => startScanner(selectedCameraId)}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20"
            >
              <Camera className="w-4 h-4" /> Start Camera
            </button>
          ) : (
            <button
              onClick={stopScanner}
              className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
            >
              Stop Camera
            </button>
          )}

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${soundEnabled
                ? 'bg-slate-700 text-emerald-400 border-slate-600'
                : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            title={soundEnabled ? 'Sound Enabled' : 'Sound Disabled'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {cameraError && (
        <div className="w-full bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl p-4 text-xs font-medium flex items-start gap-3 shadow-lg">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-rose-200 text-sm mb-1">Camera Permission Required</p>
            <p>{cameraError}</p>
          </div>
        </div>
      )}

      <div className="w-full relative bg-slate-950 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl min-h-[320px] flex items-center justify-center">
        <div id={readerElementId} className="w-full h-full"></div>

        {!isScanning && !cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 p-6 text-center z-10">
            <Camera className="w-12 h-12 text-slate-600 mb-3 animate-pulse" />
            <h4 className="font-bold text-slate-200 text-base mb-1">Entrance Gate Scanner Ready</h4>
            <p className="text-xs text-slate-400 max-w-xs mb-4">
              Select camera and click Start Camera to begin continuous candidate check-in.
            </p>
            <button
              onClick={() => startScanner(selectedCameraId)}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              <Camera className="w-4 h-4" /> Start Camera
            </button>
          </div>
        )}

        {scanResult && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
            {scanResult.status === 'SUCCESS' && (
              <div className="w-full h-full bg-emerald-950/95 border-4 border-emerald-500 rounded-2xl p-6 flex flex-col items-center justify-center shadow-2xl">
                <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-2 animate-bounce" />
                <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 mb-1">
                  ✓ ENTRANCE VERIFIED
                </span>
                <h2 className="text-2xl font-black text-white mb-1">
                  {scanResult.candidate?.name}
                </h2>
                <div className="bg-emerald-900/60 rounded-xl px-4 py-1.5 border border-emerald-500/40 mb-3 text-xs font-mono text-emerald-200">
                  ID: {scanResult.candidate?.studentId} {scanResult.candidate?.program ? `| ${scanResult.candidate.program}` : ''}
                </div>
                <p className="text-xs font-semibold text-emerald-300 max-w-sm">
                  {scanResult.message}
                </p>
                {autoResetTimer !== null && (
                  <span className="text-[11px] text-emerald-400/70 font-mono mt-3 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Resetting scanner in {autoResetTimer}s...
                  </span>
                )}
              </div>
            )}

            {scanResult.status === 'DUPLICATE' && (
              <div className="w-full h-full bg-amber-950/95 border-4 border-amber-500 rounded-2xl p-6 flex flex-col items-center justify-center shadow-2xl">
                <AlertTriangle className="w-16 h-16 text-amber-400 mb-2 animate-pulse" />
                <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400 mb-1">
                  ⚠ ALREADY SCANNED
                </span>
                <h2 className="text-2xl font-black text-white mb-1">
                  {scanResult.candidate?.name || 'Candidate'}
                </h2>
                <div className="bg-amber-900/60 rounded-xl px-4 py-1.5 border border-amber-500/40 mb-3 text-xs font-mono text-amber-200">
                  ID: {scanResult.candidate?.studentId}
                </div>
                <p className="text-xs font-semibold text-amber-200 max-w-sm">
                  {scanResult.message}
                </p>
                {autoResetTimer !== null && (
                  <span className="text-[11px] text-amber-400/70 font-mono mt-3 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Resetting scanner in {autoResetTimer}s...
                  </span>
                )}
              </div>
            )}

            {scanResult.status === 'NOT_ELIGIBLE' && (
              <div className="w-full h-full bg-rose-950/95 border-4 border-rose-500 rounded-2xl p-6 flex flex-col items-center justify-center shadow-2xl">
                <XCircle className="w-16 h-16 text-rose-500 mb-2" />
                <span className="text-xs font-extrabold uppercase tracking-widest text-rose-400 mb-1">
                  ✕ ENTRANCE ACCESS DENIED
                </span>
                <h2 className="text-2xl font-black text-white mb-1">
                  {scanResult.candidate?.name || 'Candidate'}
                </h2>
                <div className="bg-rose-900/60 rounded-xl px-4 py-1.5 border border-rose-500/40 mb-3 text-xs font-mono text-rose-200">
                  ID: {scanResult.candidate?.studentId}
                </div>
                <p className="text-xs font-bold text-rose-300 max-w-sm">
                  {scanResult.message}
                </p>
                {autoResetTimer !== null && (
                  <span className="text-[11px] text-rose-400/70 font-mono mt-3 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Resetting scanner in {autoResetTimer}s...
                  </span>
                )}
              </div>
            )}

            {(scanResult.status === 'INVALID' ||
              scanResult.status === 'EVENT_INACTIVE' ||
              scanResult.status === 'QR_DISABLED' ||
              scanResult.status === 'WRONG_EVENT') && (
                <div className="w-full h-full bg-slate-950/95 border-4 border-rose-600 rounded-2xl p-6 flex flex-col items-center justify-center shadow-2xl">
                  <XCircle className="w-16 h-16 text-rose-500 mb-2" />
                  <span className="text-xs font-extrabold uppercase tracking-widest text-rose-400 mb-1">
                    ✕ {scanResult.status.replace(/_/g, ' ')}
                  </span>
                  <h3 className="text-lg font-bold text-white mb-2 max-w-sm">
                    {scanResult.message}
                  </h3>
                  {autoResetTimer !== null && (
                    <span className="text-[11px] text-slate-400 font-mono mt-3 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Resetting scanner in {autoResetTimer}s...
                    </span>
                  )}
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
};
