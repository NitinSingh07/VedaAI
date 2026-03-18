'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus, Loader2, MoreVertical, Search, SlidersHorizontal,
  Eye, Trash2,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import axios from 'axios';
import toast from 'react-hot-toast';

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
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchAssignments = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/assignments`);
      setAssignments(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAssignments(); }, []);

  const handleDelete = async (id: string) => {
    setAssignments((prev) => prev.filter((a) => a._id !== id));
    try {
      await axios.delete(`${API_URL}/assignments/${id}`);
      toast.success('Assignment deleted');
    } catch {
      toast.error('Failed to delete assignment');
      fetchAssignments(); // re-fetch to restore correct state
    }
  };

  const filtered = assignments.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#F0F0F5]">
      <Sidebar assignmentCount={assignments.length} />
      <div className="ml-[304px] flex-1 flex flex-col min-h-screen">
        <Topbar title="Assignment" showBack />

        <main className="flex-1 pt-14 pb-24">
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          ) : assignments.length === 0 ? (
            <EmptyState />
          ) : (
            <FilledState
              assignments={filtered}
              search={search}
              onSearch={setSearch}
              onDelete={handleDelete}
            />
          )}
        </main>

        {assignments.length > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 ml-[152px] z-20">
            <Link
              href="/create"
              className="flex items-center gap-2.5 bg-[#1A1A2E] text-white font-semibold text-sm px-6 py-3.5 rounded-full shadow-2xl hover:bg-black transition-all hover:scale-105 active:scale-95"
              style={{ boxShadow: '0 8px 32px rgba(26,26,46,0.35)' }}
            >
              <Plus className="w-4 h-4" />
              Create Assignment
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-24 px-8 text-center">
      <div className="mb-8">
        <svg width="220" height="180" viewBox="0 0 220 180" fill="none">
          <circle cx="110" cy="90" r="72" fill="#E8E8EF" />
          <rect x="72" y="34" width="60" height="80" rx="8" fill="white" stroke="#D8D8E8" strokeWidth="1.5"/>
          <rect x="82" y="50" width="40" height="3.5" rx="2" fill="#D8D8E8"/>
          <rect x="82" y="60" width="30" height="3.5" rx="2" fill="#D8D8E8"/>
          <rect x="82" y="70" width="35" height="3.5" rx="2" fill="#D8D8E8"/>
          <rect x="82" y="80" width="22" height="3.5" rx="2" fill="#D8D8E8"/>
          <circle cx="130" cy="98" r="26" fill="white" stroke="#D8D8E8" strokeWidth="2"/>
          <circle cx="130" cy="98" r="18" fill="#FDE8E8"/>
          <path d="M122 90L138 106M138 90L122 106" stroke="#E8472A" strokeWidth="3" strokeLinecap="round"/>
          <path d="M143 112L157 126" stroke="#C8C8D8" strokeWidth="5" strokeLinecap="round"/>
          <path d="M78 128 L80.5 125 L83 128 L80.5 131 Z" fill="#E8472A" opacity="0.35"/>
          <circle cx="162" cy="58" r="4.5" fill="#E8472A" opacity="0.18"/>
          <path d="M64 78 L66 75.5 L68 78 L66 80.5 Z" fill="#1A1A2E" opacity="0.18"/>
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2.5">No assignments yet</h2>
      <p className="text-sm text-gray-500 max-w-xs leading-relaxed mb-8">
        Create your first assignment to start collecting and grading student submissions.
      </p>
      <Link
        href="/create"
        className="inline-flex items-center gap-2 bg-[#1A1A2E] text-white font-semibold text-sm px-7 py-3.5 rounded-full hover:bg-black transition-all"
        style={{ boxShadow: '0 6px 24px rgba(26,26,46,0.3)' }}
      >
        <Plus className="w-4 h-4" />
        Create Your First Assignment
      </Link>
    </div>
  );
}

function FilledState({
  assignments, search, onSearch, onDelete,
}: {
  assignments: Assignment[];
  search: string;
  onSearch: (s: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="px-8 pt-6 space-y-5">
      <div className="flex items-start gap-3">
        <div className="mt-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0 ring-4 ring-emerald-100" />
        <div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">Assignments</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage and create assignments for your classes.</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-2xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filter By
        </button>
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search Assignment"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-2xl border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-300 transition-colors"
          />
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-12 text-sm text-gray-400">No assignments match your search.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map((a) => (
            <AssignmentCard key={a._id} assignment={a} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function AssignmentCard({ assignment: a, onDelete }: { assignment: Assignment; onDelete: (id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const assignedDate = new Date(a.createdAt).toLocaleDateString('en-GB').replace(/\//g, '-');
  const dueDate = new Date(a.dueDate).toLocaleDateString('en-GB').replace(/\//g, '-');

  return (
    <div className="bg-white rounded-3xl p-5 border border-gray-100 hover:shadow-md transition-all duration-200 relative">
      <div className="flex items-start justify-between gap-3 mb-4">
        <h3 className="font-bold text-gray-900 text-[15px] leading-snug line-clamp-2 flex-1">{a.title}</h3>
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-9 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-30 min-w-[160px]"
              style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
            >
              {a.status === 'completed' && (
                <button
                  onClick={() => { setMenuOpen(false); router.push(`/result/${a._id}`); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-gray-400" />
                  View Assignment
                </button>
              )}
              <button
                onClick={() => { setMenuOpen(false); onDelete(a._id); }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-medium bg-[#FFF0EE] text-[#E8472A] px-2.5 py-1 rounded-full">{a.subject}</span>
        <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">Grade {a.grade}</span>
        <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full ml-auto">{a.totalMarks} marks</span>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span><span className="font-semibold text-gray-700">Assigned on</span> : {assignedDate}</span>
        <span><span className="font-semibold text-gray-700">Due</span> : {dueDate}</span>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
        <StatusBadge status={a.status} />
        {a.status === 'completed' && (
          <button
            onClick={() => router.push(`/result/${a._id}`)}
            className="text-xs font-semibold text-[#E8472A] hover:underline"
          >
            View Paper →
          </button>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; className: string }> = {
    completed: { label: '✓ Completed', className: 'text-emerald-600 bg-emerald-50' },
    processing: { label: '⟳ Processing', className: 'text-blue-600 bg-blue-50' },
    pending:    { label: '◷ Pending',    className: 'text-amber-600 bg-amber-50' },
    failed:     { label: '✕ Failed',     className: 'text-red-500 bg-red-50' },
  };
  const c = cfg[status] || cfg.pending;
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${c.className}`}>{c.label}</span>
  );
}
