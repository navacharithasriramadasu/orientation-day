import React, { useState } from 'react';
import { Search, GraduationCap, AlertCircle, CheckCircle, Sparkles } from '../components/Icons';
import { api } from '../services/api';
import { QRCard } from '../components/QRCard';

export const CandidateRegister: React.FC = () => {
  const [studentIdInput, setStudentIdInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [verificationData, setVerificationData] = useState<any | null>(null);
  const [qrPass, setQrPass] = useState<any | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentIdInput.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setVerificationData(null);
    setQrPass(null);

    try {
      const res = await api.verifyCandidate(studentIdInput.trim());

      if (!res.eligible) {
        setVerificationData(res);
        setErrorMsg(res.message);
        return;
      }

      setVerificationData(res);

      const regRes = await api.registerCandidate(studentIdInput.trim());
      setQrPass(regRes);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during Student ID verification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950">
      <div className="w-full max-w-xl mx-auto space-y-8 text-center">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Official Student Portal
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Orientation Day - 2026 Batch Pass
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Enter your official Student ID to verify eligibility and generate your entrance QR card.
          </p>
        </div>

        {!qrPass && (
          <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-left space-y-6">
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Official Student ID / Roll Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={studentIdInput}
                    onChange={(e) => setStudentIdInput(e.target.value)}
                    placeholder="e.g. 2451-22-732-001 or 1608-22-732-001"
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-3.5 pl-11 pr-4 text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                  <Search className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !studentIdInput.trim()}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="inline-block w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <GraduationCap className="w-5 h-5" />
                    <span>Verify & Generate QR Pass</span>
                  </>
                )}
              </button>
            </form>

            {errorMsg && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl p-4 text-xs font-medium flex items-start gap-3 animate-in fade-in duration-200">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-rose-200 text-sm">Verification Notice</p>
                  <p className="leading-relaxed">{errorMsg}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {qrPass && (
          <div className="space-y-6 animate-in zoom-in-95 duration-300">
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl p-4 text-xs font-semibold flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span>You are eligible for Orientation Day - 2026 Batch. Entrance pass activated!</span>
            </div>

            <QRCard
              candidate={qrPass.candidate}
              event={qrPass.event}
              token={qrPass.qrToken}
            />

            <button
              onClick={() => {
                setQrPass(null);
                setStudentIdInput('');
                setVerificationData(null);
              }}
              className="text-xs font-semibold text-slate-400 hover:text-slate-200 underline cursor-pointer"
            >
              Verify another Student ID
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
