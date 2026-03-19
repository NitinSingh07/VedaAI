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
      <div className="ml-[251px] flex-1 flex flex-col min-h-screen">
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
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 ml-[128px] z-20">
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
    <div className="flex flex-col items-center justify-center min-h-[600px] px-8 text-center py-16">
      {/* Precision Illustration Area — (Reference 691: 1:1 Surgical Rebuild) */}
      <div className="mb-12 relative">
        <svg width="300" height="300" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="blobGradient" x1="150" y1="30" x2="150" y2="270" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F2F2F2" />
              <stop offset="100%" stopColor="#EFEFEF" />
            </linearGradient>
            <linearGradient id="lensGlassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="white" />
              <stop offset="100%" stopColor="#FFADAD" />
            </linearGradient>
            <filter id="glareBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
            </filter>
            <filter id="cloudShadow" x="-20%" y="-20%" width="140%" height="150%">
              <feDropShadow dx="6" dy="4" stdDeviation="6.5" floodColor="#1B77B8" floodOpacity="0.09" />
            </filter>
            <filter id="docShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="20" stdDeviation="15" floodColor="#929292" floodOpacity="0.19" />
            </filter>
          </defs>

          {/* Background blob (Reference 598/691: 240x240) */}
          <circle cx="150" cy="150" r="120" fill="url(#blobGradient)" />

          {/* Loopy 'Spring' Swirl Doodle (Reference 691: 82x74 - Surgical Path) */}
          <path d="M40 85C22 75 16 100 28 115C40 130 65 125 70 110C75 95 60 80 45 85C30 90 30 120 50 130C70 140 90 125 85 105C80 85 60 80 45 85C35 90 35 110 50 115" stroke="#011625" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
          
          {/* Cloud (Reference 691: 70.22 x 40.39 with Blue Shadow) */}
          <g filter="url(#cloudShadow)">
            <rect x="210" y="80" width="70.22" height="40.39" rx="20.2" fill="white" />
            <circle cx="230" cy="95" r="8" fill="#D4D4D4" opacity="0.4" />
            <rect x="245" y="92" width="20" height="6" rx="3" fill="#D4D4D4" opacity="0.3" />
          </g>

          {/* Document / Page (Reference 560/691: 124.54 x 155, rx=16) */}
          <g filter="url(#docShadow)">
            <rect x="85" y="70" width="124.54" height="155.03" rx="16" fill="white" />
          </g>
          
          {/* Title Bar (Reference 560/691: 50 x 9.8, #011625) */}
          <rect x="100" y="90" width="50" height="9.8" rx="4.9" fill="#011625" />
          
          {/* Text Bars (Reference 560/691: 100 x 9.8, #D4D4D4) */}
          <rect x="100" y="108" width="100" height="9.8" rx="4.9" fill="#D4D4D4" />
          <rect x="100" y="126" width="100" height="9.8" rx="4.9" fill="#D4D4D4" />
          <rect x="100" y="144" width="100" height="9.8" rx="4.9" fill="#D4D4D4" />
          <rect x="100" y="162" width="100" height="9.8" rx="4.9" fill="#D4D4D4" />

          {/* Lens Handle part (Reference 691: Purple Purple Purple) */}
          <rect x="195" y="195" width="22" height="57" rx="11" fill="#E1DCEB" transform="rotate(-40.76 195 195)" />

          {/* Lens Rim (Reference 691: 125x125) */}
          <circle cx="175" cy="165" r="62.5" fill="#E1DCEB" opacity="0.5" />
          
          {/* Lens Inner Glass (Reference 691: 106x106) */}
          <circle cx="175" cy="165" r="53" fill="url(#lensGlassGradient)" />

          {/* ACCENT: Blue Dot ON Lens (Reference 691 screenshot 1/4/5) */}
          <circle cx="202" cy="148" r="6.5" fill="#417BA4" opacity="0.85" />

          {/* Lens Glare (Reference 691: blurred white) */}
          <circle cx="165" cy="155" r="50" fill="white" opacity="0.25" filter="url(#glareBlur)" />

          {/* Close icon / Red X (Reference 691: center of lens) */}
          <g transform="translate(150, 140)">
            <path d="M10 10L40 40M40 10L10 40" stroke="#FF4040" strokeWidth="8" strokeLinecap="round" />
          </g>

          {/* Orange Diamond / Star (Reference 691 left side) */}
          <path d="M105 180L108 176L111 180L108 184Z" fill="#E8472A" opacity="0.5" />
        </svg>
      </div>

      <h2 className="text-[20px] font-[700] text-gray-900 mb-3 tracking-[-0.04em] leading-[1.4]">
        No assignments yet
      </h2>
      <p className="text-[16px] font-[400] text-[#5E5E5E] opacity-80 max-w-[486px] leading-[1.4] tracking-[-0.04em] mb-12">
        Create your first assignment to start collecting and grading student submissions. 
        You can set up rubrics, define marking criteria, and let AI assist with grading.
      </p>

      {/* Primary Button Dark — 46px with 1.5px Gradient Border */}
      <div className="h-[46px] p-[1.5px] rounded-full bg-gradient-to-b from-white/60 to-gray-400/20 shadow-lg">
        <Link
          href="/create"
          className="flex items-center justify-center gap-2 h-full px-6 bg-[#181818] text-white font-bold text-sm rounded-full hover:bg-black transition-all group"
        >
          <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
          Create Your First Assignment
        </Link>
      </div>
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
