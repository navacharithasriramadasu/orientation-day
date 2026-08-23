import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  LayoutDashboard,
  Upload,
  Users,
  QrCode,
  ClipboardList,
  Calendar,
  LogOut,
  ShieldCheck,
  Power,
  UserCheck,
} from './Icons';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, studentSession, logout } = useAuth();

  // Hide navbar on login / unauthenticated root page for a clean full-screen view
  if (!role && (location.pathname === '/' || location.pathname === '/login')) {
    return null;
  }

  const adminNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Import Data', path: '/import', icon: Upload },
    { label: 'Candidates', path: '/candidates', icon: Users },
    { label: 'QR Scanner', path: '/scanner', icon: QrCode },
    { label: 'Attendance', path: '/attendance', icon: ClipboardList },
    { label: 'Events', path: '/events', icon: Calendar },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getHomePath = () => {
    if (role === 'STUDENT') return '/pass';
    if (role === 'ADMIN') return '/dashboard';
    return '/login';
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link to={getHomePath()} className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-white p-0.5 shadow-lg shadow-emerald-500/10 group-hover:scale-105 transition-transform flex-shrink-0">
                <img
                  src="/mvsr-logo.png"
                  alt="MVSR Engineering College"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = '<span class="w-full h-full flex items-center justify-center text-emerald-600 font-black text-xs">MVSR</span>';
                  }}
                />
              </div>
              <div>
                <span className="font-extrabold text-sm sm:text-base text-white tracking-tight group-hover:text-emerald-400 transition-colors">
                  MVSR Engineering College
                </span>
                <span className="text-[10px] text-slate-400 block font-medium">
                  Orientation Day - 2026 Batch · Gate Pass System
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            {role === 'ADMIN' && (
              <>
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}

                <div className="h-6 w-px bg-slate-800 mx-2" />

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span>Admin</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                  title="Sign Out"
                >
                  <Power className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            )}

            {role === 'STUDENT' && studentSession && (
              <>
                <Link
                  to="/pass"
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    location.pathname === '/pass'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  My QR Pass
                </Link>

                <div className="h-6 w-px bg-slate-800 mx-2" />

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono font-semibold">
                  <GraduationCap className="w-4 h-4 text-emerald-400" />
                  <span>{studentSession.candidate.studentId}</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            )}
          </nav>

          {/* Mobile Auth Actions */}
          <div className="flex md:hidden items-center gap-2">
            {role === 'ADMIN' && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer text-xs font-semibold"
                title="Sign Out"
              >
                <Power className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Links */}
      {role && (
        <div className="md:hidden border-t border-slate-800 px-2 py-2 flex items-center justify-around overflow-x-auto">
          {role === 'ADMIN' &&
            adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] font-medium min-w-[55px] text-center ${
                    isActive ? 'text-emerald-400 font-bold' : 'text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4 mx-auto" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

          {role === 'STUDENT' && (
            <div className="flex items-center justify-between w-full px-4 py-1">
              <Link
                to="/pass"
                className="flex items-center gap-2 text-xs font-bold text-emerald-400"
              >
                <UserCheck className="w-4 h-4" /> My Pass ({studentSession?.candidate?.studentId})
              </Link>
              <button
                onClick={handleLogout}
                className="text-xs font-semibold text-rose-400 flex items-center gap-1"
              >
                <Power className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
