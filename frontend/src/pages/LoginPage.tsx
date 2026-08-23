import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  GraduationCap,
  ShieldCheck,
  Lock,
  AlertCircle,
  QrCode,
  Eye,
  EyeOff,
} from '../components/Icons';

export const LoginPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'STUDENT' | 'ADMIN'>('STUDENT');

  // Student State
  const [studentId, setStudentId] = useState<string>('');
  const [studentPassword, setStudentPassword] = useState<string>('');
  const [showStudentPassword, setShowStudentPassword] = useState<boolean>(false);
  const [studentLoading, setStudentLoading] = useState<boolean>(false);
  const [studentError, setStudentError] = useState<string | null>(null);

  // Admin State
  const [adminUsername, setAdminUsername] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [showAdminPassword, setShowAdminPassword] = useState<boolean>(false);
  const [adminLoading, setAdminLoading] = useState<boolean>(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  const { loginStudent, loginAdmin } = useAuth();
  const navigate = useNavigate();

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanStudentId = studentId.trim();
    const cleanPassword = studentPassword.trim() || cleanStudentId;

    if (!cleanStudentId) {
      setStudentError('Please enter your roll number.');
      return;
    }

    setStudentLoading(true);
    setStudentError(null);

    try {
      console.log('[Student Login Request]', { studentId: cleanStudentId });
      const res = await api.studentLogin(cleanStudentId, cleanPassword);
      if (res.status === 'NOT_FOUND') {
        setStudentError(res.error || 'Student record not found in official orientation list.');
        return;
      }
      loginStudent(res);
      navigate('/pass');
    } catch (err: any) {
      setStudentError(err.message || 'Authentication failed. Please check your roll number.');
    } finally {
      setStudentLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = adminUsername.trim();
    const cleanPassword = adminPassword.trim();

    if (!cleanUsername || !cleanPassword) {
      setAdminError('Please enter both username and password.');
      return;
    }

    setAdminLoading(true);
    setAdminError(null);

    try {
      console.log('[Admin Login Request]', { username: cleanUsername, passwordLength: cleanPassword.length });
      const res = await api.login(cleanUsername, cleanPassword);
      loginAdmin(res.token, res.user);
      navigate('/dashboard');
    } catch (err: any) {
      setAdminError(err.message || 'Invalid administrator credentials.');
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fbff] text-slate-800 font-sans relative overflow-x-hidden overflow-y-auto py-6 sm:py-10 flex flex-col items-center justify-start">
      
      {/* ── Background Dot Patterns (Top-Left & Top-Right) ── */}
      <div 
        className="absolute top-0 left-0 w-36 sm:w-72 h-36 sm:h-72 opacity-25 pointer-events-none z-0"
        style={{
          backgroundImage: 'radial-gradient(#2563eb 1.5px, transparent 1.5px)',
          backgroundSize: '16px 16px',
        }}
      />
      <div 
        className="absolute top-0 right-0 w-36 sm:w-72 h-36 sm:h-72 opacity-25 pointer-events-none z-0"
        style={{
          backgroundImage: 'radial-gradient(#2563eb 1.5px, transparent 1.5px)',
          backgroundSize: '16px 16px',
        }}
      />

      {/* ── Natural Transparent Campus Background ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <img 
          src="/college-bg.jpg" 
          alt="Campus Background" 
          className="w-full h-full object-cover object-center opacity-30"
        />
      </div>

      <div className="w-full max-w-xl mx-auto px-4 sm:px-6 relative z-10 flex flex-col items-center my-auto">
        
        {/* ── 1. Top Header & Title ── */}
        <div className="text-center space-y-2 mb-6 sm:mb-8 relative w-full flex flex-col items-center">
          
          {/* Circular College Emblem */}
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white shadow-md border border-slate-100 p-1 mb-1 ring-4 ring-blue-500/15">
            <img 
              src="/mvsr-logo.png" 
              alt="College Emblem" 
              className="w-full h-full object-contain rounded-full"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = `<span class="text-blue-600 font-black text-2xl">🎓</span>`;
              }}
            />
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Orientation Day <span className="text-blue-600 font-extrabold">2026</span>
          </h1>

          <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-widest">
            Gate Pass System
          </p>

          {/* Diamond Separator */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <div className="h-[1.5px] w-8 sm:w-12 bg-slate-300" />
            <span className="w-2 h-2 bg-blue-600 rotate-45 transform" />
            <div className="h-[1.5px] w-8 sm:w-12 bg-slate-300" />
          </div>

          {/* PROMINENT LARGE COLLEGE NAMES */}
          <div className="flex items-center justify-center text-base sm:text-xl md:text-2xl font-black text-slate-900 pt-1 text-center">
            <span className="tracking-tight text-slate-900">MVSR Engineering College</span>
          </div>
        </div>

        {/* ── 2. Main Login Card ── */}
        <div className="w-full bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-xl shadow-blue-950/10 border border-slate-100 p-5 sm:p-8 space-y-5">
          
          {/* Card Header: Welcome Avatar & Shield */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">Welcome!</h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">Sign in to continue</p>
              </div>
            </div>

            {/* Sparkly Security Shield Badge */}
            <div className="relative shrink-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping opacity-75" />
            </div>
          </div>

          {/* Segmented Pill Tabs (Student vs Admin) */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-100 rounded-xl sm:rounded-2xl border border-slate-200/60">
            <button
              type="button"
              id="tab-student"
              onClick={() => { setActiveTab('STUDENT'); setStudentError(null); }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'STUDENT'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4 shrink-0" />
              <span>Student</span>
            </button>
            
            <button
              type="button"
              id="tab-admin"
              onClick={() => { setActiveTab('ADMIN'); setAdminError(null); }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'ADMIN'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Admin</span>
            </button>
          </div>

          {/* ── STUDENT LOGIN FORM ── */}
          {activeTab === 'STUDENT' && (
            <form onSubmit={handleStudentLogin} className="space-y-4 animate-in fade-in duration-200">
              
              {/* Tip Box with Lightbulb */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/90 border border-blue-100 text-blue-900 text-xs font-medium leading-relaxed">
                <svg className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                  <path d="M9 18h6M10 22h4" />
                </svg>
                <span><strong>Tip:</strong> Your Roll Number is both your User ID and Password.</span>
              </div>

              {/* Student Roll Number Input */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  ROLL NUMBER (USER ID)
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <input
                    id="student-id-input"
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-3 text-slate-900 text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Student Password Input */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  PASSWORD (ROLL NUMBER)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="student-password-input"
                    type={showStudentPassword ? 'text' : 'password'}
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-10 text-slate-900 text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStudentPassword(!showStudentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors p-1"
                  >
                    {showStudentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {studentError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium leading-relaxed animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <p>{studentError}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                id="student-login-btn"
                type="submit"
                disabled={studentLoading || !studentId.trim()}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
              >
                {studentLoading ? (
                  <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <QrCode className="w-4 h-4" />
                    <span>Sign In & Get My QR Pass</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ── ADMIN LOGIN FORM ── */}
          {activeTab === 'ADMIN' && (
            <form onSubmit={handleAdminLogin} className="space-y-4 animate-in fade-in duration-200">
              
              {/* Info banner */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/90 border border-blue-100 text-blue-900 text-xs font-medium leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span><strong>Admin Portal:</strong> Restricted to authorized ceremony staff.</span>
              </div>

              {/* Admin Username */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Admin Username / Email
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <input
                    id="admin-username-input"
                    type="text"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-3 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Admin Password */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="admin-password-input"
                    type={showAdminPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-10 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors p-1"
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {adminError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium leading-relaxed animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <p>{adminError}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                id="admin-login-btn"
                type="submit"
                disabled={adminLoading || !adminUsername.trim() || !adminPassword.trim()}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
              >
                {adminLoading ? (
                  <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Sign In as Administrator</span>
                  </>
                )}
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
