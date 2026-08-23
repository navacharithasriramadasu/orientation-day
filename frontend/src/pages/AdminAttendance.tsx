import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ClipboardList, Download, RefreshCw, ChevronLeft, ChevronRight, UserCheck, GraduationCap, LogIn } from '../components/Icons';

export const AdminAttendance: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pagination, setPagination] = useState<{ total: number; totalPages: number }>({ total: 0, totalPages: 1 });
  const [filterMode, setFilterMode] = useState<string>('all'); // 'all', 'entry', 'kit'

  const fetchAttendance = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {
        page: page.toString(),
        limit: '30',
      };
      const res = await api.getAttendanceLogs(params);
      setRecords(res.records || []);
      setPagination(res.pagination || { total: 0, totalPages: 1 });
    } catch (err: any) {
      setError(err.message || 'Failed to load attendance logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [page]);

  const handleExportCSV = async () => {
    try {
      const res = await api.exportAttendanceCSV();
      const url = window.URL.createObjectURL(res.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Failed to export CSV report: ' + (err.message || 'Unknown error'));
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-emerald-400" />
            Orientation Day Attendance Log
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time audit log of Orientation Day entrance check-ins and gate verifications.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAttendance}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-emerald-400" />
            Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-500/20"
          >
            <Download className="w-4 h-4" />
            Export CSV Audit Log
          </button>
        </div>
      </div>

      <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/80 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
            Loading attendance records...
          </div>
        ) : error ? (
          <div className="p-6 text-center text-rose-400 text-xs">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-700">
                <tr>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Student ID</th>
                  <th className="py-3.5 px-4">Candidate Name</th>
                  <th className="py-3.5 px-4">Program</th>
                  <th className="py-3.5 px-4">Fee Status</th>
                  <th className="py-3.5 px-4">Event Checkpoint</th>
                  <th className="py-3.5 px-4">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 font-medium">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      No scan records logged yet. Start scanning student QR passes at the entrance gate.
                    </td>
                  </tr>
                ) : (
                  records.map((r) => {
                    const timestamp = r.entryTime || r.scannedAt || r.createdAt;
                    const studentId = r.studentId || r.candidate?.studentId;
                    const candidateName = r.candidateName || r.candidate?.name;
                    const program = r.program || r.candidate?.program;
                    const feeStatus = r.paymentStatus || r.candidate?.paymentStatus || 'Paid';
                    const eventName = r.eventName || r.event?.name || 'Orientation Day - 2026 Batch';

                    return (
                      <tr key={r.id} className="hover:bg-slate-700/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-slate-400">
                          {timestamp ? new Date(timestamp).toLocaleString() : 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-white">
                          {studentId}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-100">
                          {candidateName}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">{program}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              feeStatus.toLowerCase().includes('paid') && !feeStatus.toLowerCase().includes('unpaid')
                                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {feeStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                            <LogIn className="w-3.5 h-3.5" />
                            {eventName}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 font-bold text-[11px] px-2.5 py-0.5 rounded-full border text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
                            <UserCheck className="w-3.5 h-3.5" /> ENTRY VERIFIED
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="bg-slate-900/60 border-t border-slate-700 px-6 py-4 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Total Records: <strong className="text-white">{pagination.total}</strong> | Page {page} of {pagination.totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
