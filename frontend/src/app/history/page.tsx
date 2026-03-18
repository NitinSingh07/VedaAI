'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen, CheckCircle2, Clock, AlertCircle,
  Loader2, ChevronRight, PlusCircle, Search, Filter
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Assignment {
  _id: string;
  title: string;
  subject: string;
  grade: string;
  status: string;
  totalMarks: number;
  createdAt: string;
  dueDate: string;
  questionTypes: Array<{ type: string; count: number; marksPerQuestion: number }>;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  pending: { label: 'Pending', icon: <Clock className="w-3.5 h-3.5" />, className: 'bg-amber-50 text-amber-700 border-amber-200' },
  processing: { label: 'Processing', icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />, className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  completed: { label: 'Completed', icon: <CheckCircle2 className="w-3.5 h-3.5" />, className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  failed: { label: 'Failed', icon: <AlertCircle className="w-3.5 h-3.5" />, className: 'bg-red-50 text-red-700 border-red-200' },
};

export default function HistoryPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    axios.get(`${API_URL}/assignments`)
      .then(({ data }) => setAssignments(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = assignments.filter((a) => {
    const matchSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.subject.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">
      <Sidebar />
      <div className="ml-[304px] flex-1 flex flex-col">
        <Topbar title="History" />

      <main className="flex-1 pt-14 p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assessment History</h1>
            <p className="text-sm text-gray-400 mt-0.5">All your generated question papers</p>
          </div>
          <Link href="/create" className="btn-dark text-sm">
            <PlusCircle className="w-4 h-4" />
            New Assessment
          </Link>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            {['all', 'completed', 'processing', 'pending', 'failed'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  statusFilter === s
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-slate-500">No assessments found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Subject</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Grade</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Marks</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((a) => {
                  const sc = STATUS_CONFIG[a.status] || STATUS_CONFIG.pending;
                  return (
                    <tr key={a._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-800 line-clamp-1">{a.title}</p>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">{a.subject}</td>
                      <td className="px-4 py-4 text-sm text-slate-600">Grade {a.grade}</td>
                      <td className="px-4 py-4 text-sm font-medium text-indigo-600">{a.totalMarks}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${sc.className}`}>
                          {sc.icon}
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-500">
                        {new Date(a.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-4">
                        {a.status === 'completed' ? (
                          <Link
                            href={`/result/${a._id}`}
                            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                          >
                            View Paper <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-400">–</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
      </div>
    </div>
  );
}
