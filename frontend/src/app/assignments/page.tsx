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
import MobileTopbar from '@/components/MobileTopbar';
import MobileBottomNav from '@/components/MobileBottomNav';
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
      {/* Sidebar — desktop only */}
      <div className="hidden md:block">
        <Sidebar assignmentCount={assignments.length} />
      </div>

      {/* Mobile topbar & bottom nav */}
      <MobileTopbar />
      <MobileBottomNav />

      <div className="flex-1 flex flex-col min-h-screen md:ml-[328px]">
        {/* Desktop topbar */}
        <div className="hidden md:block">
          <Topbar title="Assignment" showBack />
        </div>

        {/* pt-[78px] on mobile (topbar 56+12+10=78), pt-20 on desktop */}
        <main className="flex-1 pt-[78px] md:pt-20 pb-[155px] md:pb-24">
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
          <div className="hidden md:block fixed bottom-8 left-1/2 -translate-x-1/2 ml-[164px] z-20">
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
    <div className="flex flex-col items-center justify-center min-h-[calc(100svh-240px)] md:min-h-[600px] px-6 text-center py-8 md:py-16">
      <div className="mb-6 md:mb-12 relative">
        <svg width="220" height="220" className="md:w-[300px] md:h-[300px]" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
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
      <p className="text-[16px] font-[400] text-[#5E5E5E] opacity-80 max-w-[280px] md:max-w-[486px] leading-[1.4] tracking-[-0.04em] mb-8 md:mb-12">
        Create your first assignment to start collecting and grading student submissions.
        You can set up rubrics, define marking criteria, and let AI assist with grading.
      </p>

      {/* Primary Button Dark — 46px with 1.5px Gradient Border */}
      <div className="h-[46px] p-[1.5px] rounded-full bg-gradient-to-b from-white/60 to-gray-400/20 shadow-lg">
        <Link
          href="/create"
          className="flex items-center justify-center gap-2 h-full px-6 bg-[#181818] text-white rounded-full hover:bg-black transition-all group"
          style={{ fontSize: 16, fontWeight: 500, letterSpacing: '-0.04em', lineHeight: '140%', fontFamily: 'var(--font-bricolage, inherit)' }}
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
  const router = useRouter();
  return (
    /* Mobile: px-[10px], gap:24px | Desktop: px-6, gap:10px */
    <div className="px-[10px] md:px-6 pt-2 md:pt-4 flex flex-col gap-6 md:gap-[10px]">

      {/* Mobile sub-header: ← Assignments (48px, space-between) */}
      <div
        className="flex md:hidden items-center justify-between"
        style={{ height: 48 }}
      >
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.10)' }}
        >
          <svg width="16" height="13" viewBox="0 0 18 15" fill="none">
            <path d="M17 7.5H1M1 7.5L7.5 1M1 7.5L7.5 14" stroke="#303030" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span style={{ fontSize: 16, fontWeight: 600, color: '#303030', letterSpacing: '-0.04em' }}>
          Assignments
        </span>
        <div className="w-9" />{/* spacer to center title */}
      </div>

      {/* Desktop header: green dot + Assignments + subtitle */}
      <div className="hidden md:flex items-center gap-3 px-2">
        <div
          className="mt-1 flex-shrink-0 rounded-full"
          style={{ width: 12, height: 12, backgroundColor: '#4BC26D', border: '4px solid rgba(75,194,109,0.4)' }}
        />
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#303030', lineHeight: '140%', letterSpacing: '-0.04em' }}>
            Assignments
          </h1>
          <p style={{ fontSize: 14, fontWeight: 400, color: 'rgba(94,94,94,0.55)', lineHeight: '140%', letterSpacing: '-0.04em', fontFamily: 'var(--font-bricolage, inherit)' }}>
            Manage and create assignments for your classes.
          </p>
        </div>
      </div>

      {/* Filter/Search Row — Mobile: 64px, 16px radius | Desktop: 64px, 20px radius */}
      <div
        className="flex items-center justify-between bg-white"
        style={{
          height: 64,
          borderRadius: 16,
          border: '1px solid rgba(0,0,0,0.05)',
          paddingLeft: 16,
          paddingRight: 16,
        }}
      >
        <button className="flex items-center gap-2 text-[14px] font-medium text-[#5E5E5E] hover:opacity-70 transition-opacity">
          <SlidersHorizontal className="w-4 h-4 opacity-50" />
          <span className="hidden sm:inline">Filter By</span>
          <span className="sm:hidden">Filter</span>
        </button>

        <div className="relative" style={{ width: 'clamp(140px, 50%, 380px)' }}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A9A9A9]" />
          <input
            type="text"
            placeholder="Search Name"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full h-[44px] rounded-full pl-10 pr-4 text-[14px] text-[#303030] placeholder-[#A9A9A9] focus:outline-none bg-white"
            style={{ border: '1px solid rgba(0,0,0,0.12)' }}
          />
        </div>
      </div>

      {/* Cards — Mobile: single col, gap:24px | Desktop: 2-col grid, gap:16px */}
      {assignments.length === 0 ? (
        <div className="text-center py-12 text-sm text-[#A9A9A9]">No assignments match your search.</div>
      ) : (
        <>
          {/* Mobile: vertical list */}
          <div className="flex flex-col md:hidden gap-6">
            {assignments.map((a) => (
              <AssignmentCard key={a._id} assignment={a} onDelete={onDelete} mobile />
            ))}
          </div>
          {/* Desktop: 2-col grid */}
          <div className="hidden md:grid grid-cols-2 gap-[16px]">
            {assignments.map((a) => (
              <AssignmentCard key={a._id} assignment={a} onDelete={onDelete} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function AssignmentCard({ assignment: a, onDelete, mobile = false }: {
  assignment: Assignment;
  onDelete: (id: string) => void;
  mobile?: boolean;
}) {
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
    <div
      className="bg-white flex flex-col justify-between relative"
      style={mobile ? {
        /* Mobile — Figma: Fill(373px) × Hug(116px), radius XS-16, gap:12px, padding:16px, no shadow */
        borderRadius: 16,
        padding: 16,
        minHeight: 116,
        gap: 12,
      } : {
        /* Desktop — Figma: 542×162, radius 20px, padding 24px, shadow */
        borderRadius: 20,
        padding: 24,
        minHeight: 162,
        boxShadow: '0px 32px 48px rgba(0,0,0,0.05), 0px 16px 48px rgba(0,0,0,0.12)',
        border: '1px solid rgba(0,0,0,0.05)',
      }}
    >
      {/* Top: Title + Three Dots */}
      <div className="flex items-start justify-between gap-3">
        <h3
          className="flex-1 text-[#303030]"
          style={{ fontFamily: 'var(--font-bricolage, inherit)', fontSize: 24, fontWeight: 800, lineHeight: '120%', letterSpacing: '-0.04em' }}
        >
          {a.title}
        </h3>
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-6 h-6 flex items-center justify-center text-[#A9A9A9] hover:opacity-70 transition-opacity"
          >
            <MoreVertical className="w-4 h-4" strokeWidth={2} />
          </button>

          {/* Dropdown — Figma: w=Hug(140px), h=Hug(84px), radius=Number, padding=8px, gap=4px */}
          {/* Shadows: X:0 Y:32 Blur:48 #000 5%, X:0 Y:16 Blur:48 #000 20% */}
          {menuOpen && (
            <div
              className="absolute right-0 top-8 bg-white z-30"
              style={{
                borderRadius: '12px',
                padding: '8px',
                boxShadow: '0px 32px 48px rgba(0,0,0,0.05), 0px 16px 48px rgba(0,0,0,0.20)',
              }}
            >
              <button
                onClick={() => { setMenuOpen(false); router.push(`/result/${a._id}`); }}
                className="flex items-center gap-[10px] w-full h-[32px] px-2 text-[14px] font-medium text-[#303030] hover:bg-[#F6F6F6] transition-colors whitespace-nowrap"
                style={{
                  borderRadius: '8px',
                  fontFamily: 'var(--font-bricolage, inherit)',
                }}
              >
                View Assignment
              </button>
              <div style={{ height: '4px' }} />
              <button
                onClick={() => { setMenuOpen(false); onDelete(a._id); }}
                className="flex items-center gap-[10px] w-full h-[32px] px-2 text-[14px] font-medium text-[#E8472A] hover:bg-[#F6F6F6] transition-colors whitespace-nowrap"
                style={{
                  borderRadius: '8px',
                  fontFamily: 'var(--font-bricolage, inherit)',
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Dates — Figma: justify=space-between */}
      <div
        className="flex items-center justify-between text-[14px]"
        style={{ fontFamily: 'var(--font-bricolage, inherit)' }}
      >
        <p className="text-[#303030] font-bold">Assigned on : <span className="text-[#5E5E5E] font-normal">{assignedDate}</span></p>
        <p className="text-[#303030] font-bold">Due : <span className="text-[#5E5E5E] font-normal">{dueDate}</span></p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; className: string }> = {
    completed: { label: '✓ Completed', className: 'text-emerald-600 bg-emerald-50' },
    processing: { label: '⟳ Processing', className: 'text-blue-600 bg-blue-50' },
    pending: { label: '◷ Pending', className: 'text-amber-600 bg-amber-50' },
    failed: { label: '✕ Failed', className: 'text-red-500 bg-red-50' },
  };
  const c = cfg[status] || cfg.pending;
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${c.className}`}>{c.label}</span>
  );
}
