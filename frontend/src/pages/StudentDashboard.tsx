import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { QRCard } from '../components/QRCard';
import {
  CheckCircle,
  AlertCircle,
  Clock,
  LogOut,
  GraduationCap,
  Sparkles,
  ShieldAlert,
  QrCode,
  RefreshCw,
} from '../components/Icons';
import { api } from '../services/api';

export const StudentDashboard: React.FC = () => {
  const { role, studentSession, logout, updateStudentAttendance } = useAuth();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    if (role !== 'STUDENT' || !studentSession) {
      navigate('/login');
    }
  }, [role, studentSession, navigate]);

  const handleRefreshStatus = async () => {
    if (!studentSession?.candidate?.studentId) return;
    setRefreshing(true);
    try {
      const res = await api.studentLogin(
        studentSession.candidate.studentId,
        studentSession.candidate.studentId
      );
      if (res.eligible) {
        updateStudentAttendance(res.attendance);
      }
    } catch (e) {
      console.error('Error refreshing student pass status', e);
    } finally {
      setRefreshing(false);
    }
  };

  if (!studentSession) {
    return null;
  }

  const { candidate, event, qrToken, attendance, eligible, message } = studentSession;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-start pt-6 pb-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950">
      <div className="w-full max-w-sm sm:max-w-xl mx-auto space-y-5 text-center">
        {/* Header Badge & Title */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Official Student Pass
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
            Orientation Day<br className="sm:hidden" /> - 2026
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            Welcome, <strong className="text-white">{candidate.name}</strong>. Present this QR pass at the entrance gate.
          </p>
        </div>

        {/* NON-ELIGIBLE CANDIDATE DISPLAY */}
        {!eligible && (
          <div className="bg-rose-500/10 border-2 border-rose-500/30 rounded-3xl p-6 sm:p-8 space-y-5 text-left shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <ShieldAlert className="w-8 h-8 shrink-0" />
              <div>
                <h3 className="text-xl font-extrabold text-white">Pass Not Granted</h3>
                <p className="text-xs text-rose-300">Eligibility Status: NOT ELIGIBLE</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {message ||
                `You are currently not eligible for Orientation Day entrance based on official record status.`}
            </p>

            <div className="bg-slate-900/80 rounded-2xl p-4 border border-rose-500/20 text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Student ID:</span>
                <span className="text-white font-bold">{candidate.studentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Name:</span>
                <span className="text-white font-bold">{candidate.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Program:</span>
                <span className="text-white font-bold">{candidate.program}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Switch Student Account
              </button>
            </div>
          </div>
        )}

        {/* ELIGIBLE CANDIDATE DISPLAY WITH QR PASS */}
        {eligible && qrToken && (
          <div className="space-y-6 animate-in zoom-in-95 duration-300">
            {/* Status Indicator */}
            {attendance ? (
              <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-2xl p-4 text-xs font-semibold flex items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-bold text-amber-200 text-sm block">ATTENDED / PASS USED</span>
                    <span className="text-amber-300/80">
                      Scanned at gate on {new Date(attendance.entryTime).toLocaleTimeString()} ({new Date(attendance.entryTime).toLocaleDateString()})
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleRefreshStatus}
                  disabled={refreshing}
                  className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 transition-all cursor-pointer"
                  title="Refresh Pass Status"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            ) : (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl p-4 text-xs font-semibold flex items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-emerald-200 text-sm block">PASS ACTIVE - READY FOR SCAN</span>
                    <span className="text-emerald-300/80">
                      Eligible for Orientation Day - 2026 Batch. Show this QR code to the entrance administrator.
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleRefreshStatus}
                  disabled={refreshing}
                  className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 transition-all cursor-pointer"
                  title="Refresh Pass Status"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            )}

            {/* Official QR Pass Card */}
            <QRCard
              candidate={candidate}
              event={event || { name: 'Orientation Day - 2026 Batch' }}
              token={qrToken}
            />

            {/* Account Controls */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1.5 cursor-pointer underline"
              >
                <LogOut className="w-4 h-4" /> Sign Out ({candidate.studentId})
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
