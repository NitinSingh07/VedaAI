'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  FileText, CloudUpload,
  X, Plus, Minus, ChevronDown, ArrowLeft, ArrowRight,
  Loader2, LayoutGrid, BookMarked, Sparkles, Users,
} from 'lucide-react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import MobileTopbar from '@/components/MobileTopbar';
import GenerationProgress from '@/components/GenerationProgress';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const QUESTION_TYPE_OPTIONS = [
  'Multiple Choice Questions',
  'Short Questions',
  'Long Answer Questions',
  'Diagram/Graph-Based Questions',
  'Numerical Problems',
  'True or False Questions',
  'Fill in the Blank',
  'Descriptive Questions',
];

const QUESTION_TYPE_MAP: Record<string, string> = {
  'Multiple Choice Questions': 'mcq',
  'Short Questions': 'short_answer',
  'Long Answer Questions': 'long_answer',
  'Diagram/Graph-Based Questions': 'long_answer',
  'Numerical Problems': 'short_answer',
  'True or False Questions': 'true_false',
  'Fill in the Blank': 'fill_in_blank',
  'Descriptive Questions': 'long_answer',
};

const MOBILE_NAV = [
  { href: '/home',        label: 'Home',       icon: LayoutGrid },
  { href: '/assignments', label: 'My Groups',   icon: Users },
  { href: '/library',     label: 'Library',     icon: BookMarked },
  { href: '/toolkit',     label: 'AI Toolkit',  icon: Sparkles },
];

interface QuestionRow { id: string; label: string; count: number; marks: number; }
interface Errors { [k: string]: string }

export default function CreateAssessmentPage() {
  const router = useRouter();
  const pathname = usePathname();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const title = '';
  const subject = '';
  const grade = '';
  const [dueDate, setDueDate] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [questionRows, setQuestionRows] = useState<QuestionRow[]>([
    { id: '1', label: 'Multiple Choice Questions', count: 4, marks: 1 },
    { id: '2', label: 'Short Questions', count: 3, marks: 2 },
    { id: '3', label: 'Diagram/Graph-Based Questions', count: 5, marks: 5 },
    { id: '4', label: 'Numerical Problems', count: 5, marks: 5 },
  ]);
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    generationStatus, generationMessage,
    currentAssignmentId, setCurrentAssignment, setGenerationStatus,
    addAssignment,
  } = useAssignmentStore();

  useWebSocket(currentAssignmentId);

  useEffect(() => { setGenerationStatus('idle'); }, []);

  useEffect(() => {
    if (generationStatus === 'completed' && currentAssignmentId) {
      const t = setTimeout(() => router.push(`/result/${currentAssignmentId}`), 800);
      return () => clearTimeout(t);
    }
  }, [generationStatus, currentAssignmentId]);

  const addRow = () => setQuestionRows((r) => [
    ...r, { id: Date.now().toString(), label: 'Multiple Choice Questions', count: 5, marks: 1 },
  ]);
  const removeRow = (id: string) => setQuestionRows((r) => r.filter((row) => row.id !== id));
  const updateRow = (id: string, field: 'label' | 'count' | 'marks', value: string | number) =>
    setQuestionRows((r) => r.map((row) => row.id === id ? { ...row, [field]: value } : row));
  const clampCount = (id: string, delta: number) => {
    const row = questionRows.find((r) => r.id === id);
    if (row) updateRow(id, 'count', Math.max(1, row.count + delta));
  };
  const clampMarks = (id: string, delta: number) => {
    const row = questionRows.find((r) => r.id === id);
    if (row) updateRow(id, 'marks', Math.max(1, row.marks + delta));
  };

  const totalQuestions = questionRows.reduce((s, r) => s + r.count, 0);
  const totalMarks = questionRows.reduce((s, r) => s + r.count * r.marks, 0);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const validate = () => {
    const e: Errors = {};
    if (!dueDate) e.dueDate = 'Due date is required';
    if (questionRows.length === 0) e.questions = 'Add at least one question type';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleGenerate = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    setGenerationStatus('pending', 'Submitting assignment...');
    const questionTypes = questionRows.map((r) => ({
      type: QUESTION_TYPE_MAP[r.label] || 'short_answer',
      count: r.count,
      marksPerQuestion: r.marks,
    }));
    try {
      const fd = new FormData();
      fd.append('title', title || `Assignment – ${new Date().toLocaleDateString()}`);
      fd.append('subject', subject || 'General');
      fd.append('grade', grade || '10');
      fd.append('dueDate', dueDate);
      fd.append('questionTypes', JSON.stringify(questionTypes));
      if (additionalInfo) fd.append('additionalInstructions', additionalInfo);
      if (file) fd.append('file', file);
      const { data } = await axios.post(`${API_URL}/assignments`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCurrentAssignment(data.assignmentId);
      setGenerationStatus('processing', 'AI is crafting your question paper...');
      addAssignment({
        _id: data.assignmentId, title: title || 'Assignment',
        subject: subject || 'General', grade: grade || '10',
        dueDate, status: 'processing', totalMarks,
        jobId: data.jobId, createdAt: new Date().toISOString(),
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to create assignment');
      setGenerationStatus('idle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isGenerating = generationStatus === 'processing' || generationStatus === 'pending';

  return (
    <div className="flex min-h-screen bg-[#F0F0F5]">

      {/* ── Desktop Sidebar ── */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* ── Mobile Topbar ── */}
      <MobileTopbar />

      {/* ── Mobile fixed bottom: Previous/Next + Nav bar ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        {/* blur bg behind buttons */}
        <div
          style={{
            background: 'rgba(246,246,246,0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            paddingTop: 12,
            paddingBottom: 10,
            display: 'flex',
            justifyContent: 'center',
            gap: 13,
          }}
        >
          {/* Previous — 134×46 Hug, radius XXL-48, padding T:12 R:24 B:12 L:24, gap 4, bg white */}
          <button
            type="button"
            onClick={() => router.push('/assignments')}
            style={{
              height: 46,
              borderRadius: 9999,
              border: '1.5px solid #DEDEDE',
              background: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              padding: '12px 24px',
              fontSize: 14,
              fontWeight: 700,
              color: '#303030',
              fontFamily: 'var(--font-bricolage, inherit)',
              whiteSpace: 'nowrap',
            }}
          >
            <ArrowLeft style={{ width: 14, height: 14 }} />
            Previous
          </button>

          {/* Next — 106×46 Hug, radius XXL-48, padding T:12 R:24 B:12 L:24, gap 4, bg #181818, border 1.5px */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isSubmitting || isGenerating}
            style={{
              height: 46,
              borderRadius: 9999,
              border: '1.5px solid #181818',
              background: '#181818',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              padding: '12px 24px',
              fontSize: 14,
              fontWeight: 700,
              color: '#FFFFFF',
              fontFamily: 'var(--font-bricolage, inherit)',
              whiteSpace: 'nowrap',
              opacity: isSubmitting || isGenerating ? 0.6 : 1,
            }}
          >
            {isSubmitting || isGenerating
              ? <><Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />Generating...</>
              : <>Next<ArrowRight style={{ width: 14, height: 14 }} /></>
            }
          </button>
        </div>

        {/* Nav bar — 373×72, radius 24, #181818, space-between, padding T:8 R:24 B:8 L:24 */}
        <div
          style={{
            margin: '0 10px 10px',
            height: 72,
            borderRadius: 24,
            background: '#181818',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingLeft: 24,
            paddingRight: 24,
            boxShadow: '0px 32px 48px rgba(0,0,0,0.20), 0px 16px 48px rgba(0,0,0,0.12)',
          }}
        >
          {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, minWidth: 52 }}
              >
                <Icon
                  style={{
                    width: 22, height: 22,
                    color: active ? '#FFFFFF' : '#5E5E5E',
                    strokeWidth: active ? 2.5 : 2,
                  }}
                />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: active ? 700 : 400,
                    color: active ? '#FFFFFF' : '#5E5E5E',
                    letterSpacing: '-0.02em',
                    fontFamily: 'var(--font-bricolage, inherit)',
                  }}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-[328px]">

        {/* Desktop topbar */}
        <div className="hidden md:block">
          <Topbar title="Assignment" showBack />
        </div>

        <main className="flex-1 bg-[#F6F6F6]">

          {/* ══ DESKTOP ══ */}
          <div className="hidden md:block pt-20 pb-12">
            <div className="max-w-[1103px] mx-auto px-8 pt-6 pb-6">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#E7F6EC] flex items-center justify-center flex-shrink-0"
                  style={{ boxShadow: '0 0 12px rgba(75,194,109,0.4)' }}>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#4BC26D]" />
                </div>
                <div>
                  <h1 className="text-[20px] font-bold text-[#303030] leading-tight"
                    style={{ fontFamily: 'var(--font-bricolage, inherit)' }}>
                    Create Assignment
                  </h1>
                  <p className="text-[14px] font-normal text-[#5E5E5E] mt-0.5 leading-[140%] tracking-[-0.04em]"
                    style={{ fontFamily: 'var(--font-bricolage, inherit)' }}>
                    Set up a new assignment for your students
                  </p>
                </div>
              </div>
            </div>

            <div className="max-w-[820px] mx-auto px-8">
              <div className="flex gap-2 mb-8">
                <div className="flex-1 h-[5px] rounded-full bg-[#303030]" />
                <div className="flex-1 h-[5px] rounded-full bg-[#EAEAEF]" />
              </div>

              {generationStatus !== 'idle' && (
                <div className="mb-4">
                  <GenerationProgress status={generationStatus} message={generationMessage} />
                </div>
              )}

              {/* Desktop form card */}
              <div className="rounded-[32px] flex flex-col"
                style={{ padding: 32, gap: 32, boxShadow: '0 48px 48px rgba(0,0,0,0.15), 0 16px 48px rgba(0,0,0,0.10)' }}>
                <div>
                  <h2 className="text-[16px] font-semibold text-[#303030]"
                    style={{ fontFamily: 'var(--font-bricolage, inherit)' }}>Assignment Details</h2>
                  <p className="text-[14px] font-normal text-[#5E5E5E]/55 mt-1"
                    style={{ fontFamily: 'var(--font-bricolage, inherit)' }}>
                    Basic information about your assignment
                  </p>
                </div>

                {/* File Upload */}
                <div>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer transition-all flex flex-col items-center justify-center text-center"
                    style={{ borderRadius: 24, border: `1.75px dashed ${dragOver ? '#E8472A' : 'rgba(0,0,0,0.20)'}`, background: dragOver ? '#FFF5F3' : '#FFFFFF', padding: '24px 32px', gap: 16 }}
                  >
                    {file ? (
                      <div className="flex items-center justify-center gap-3">
                        <FileText className="w-5 h-5 text-[#E8472A]" />
                        <span className="text-sm font-medium text-gray-700">{file.name}</span>
                        <button type="button"
                          onClick={(e) => { e.stopPropagation(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                          className="text-gray-400 hover:text-red-500 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <CloudUpload className="w-10 h-10 text-[#303030]" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <p className="text-[16px] font-semibold text-[#303030]">Choose a file or drag & drop it here</p>
                          <p className="text-[12px] text-[#A9A9A9]">JPEG, PNG, upto 10MB</p>
                        </div>
                        <button type="button"
                          className="flex items-center justify-center bg-[#F6F6F6] border border-[#DEDEDE] rounded-full text-[14px] font-semibold text-[#303030] hover:bg-gray-50 transition-colors shadow-sm"
                          style={{ width: 127, height: 36 }}>
                          Browse Files
                        </button>
                      </>
                    )}
                  </div>
                  <p className="text-[14px] text-[#A9A9A9] mt-3 text-center">Upload images of your preferred document/image</p>
                  <input ref={fileInputRef} type="file" accept=".pdf,.txt,.doc,.docx,.jpg,.jpeg,.png" className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </div>

                <hr className="border-[#F1F1F1]" />

                {/* Due Date */}
                <div>
                  <label className="block text-[14px] font-semibold text-[#303030] mb-2">Due Date</label>
                  <div className="relative">
                    <input type="text" value={dueDate} placeholder="Choose a chapter"
                      onFocus={(e) => { e.currentTarget.type = 'date'; e.currentTarget.min = new Date().toISOString().split('T')[0]; }}
                      onBlur={(e) => { if (!e.currentTarget.value) e.currentTarget.type = 'text'; }}
                      onChange={(e) => setDueDate(e.target.value)}
                      className={`w-full px-5 py-3.5 pr-14 rounded-2xl border text-[14px] focus:outline-none focus:border-gray-400 transition-colors [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute ${errors.dueDate ? 'border-red-300 bg-red-50' : 'border-[#DEDEDE] bg-[#F6F6F6]'} ${dueDate ? 'text-[#303030]' : 'text-[#A9A9A9]'}`}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 border border-[#DEDEDE] rounded-xl flex items-center justify-center pointer-events-none bg-white">
                      <svg className="w-4 h-4 text-[#303030]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                  </div>
                </div>

                <hr className="border-[#F1F1F1]" />

                {/* Desktop Question Table */}
                <div>
                  <div className="grid grid-cols-[1fr_auto_auto] gap-4 mb-4 px-1">
                    <span className="text-[14px] font-semibold text-[#303030]">Question Type</span>
                    <span className="text-[14px] font-semibold text-[#303030] w-36 text-center">No. of Questions</span>
                    <span className="text-[14px] font-semibold text-[#303030] w-28 text-center">Marks</span>
                  </div>
                  <div className="space-y-4">
                    {questionRows.map((row) => (
                      <div key={row.id} className="grid grid-cols-[1fr_auto_auto] gap-4 items-center">
                        <div className="flex items-center gap-3">
                          <div className="relative flex-1">
                            <select value={row.label} onChange={(e) => updateRow(row.id, 'label', e.target.value)}
                              className="w-full appearance-none px-4 pr-10 rounded-full bg-white text-[14px] text-[#303030] focus:outline-none"
                              style={{ paddingTop: 11, paddingBottom: 11, height: 44 }}>
                              {QUESTION_TYPE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A9A9A9] pointer-events-none" />
                          </div>
                          <button type="button" onClick={() => removeRow(row.id)}
                            className="w-10 h-10 rounded-2xl border border-transparent flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors flex-shrink-0 text-[#A9A9A9]">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center bg-white rounded-full px-1.5 py-1.5 gap-1.5 w-36 justify-center">
                          <button type="button" onClick={() => clampCount(row.id, -1)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-50 flex-shrink-0">
                            <Minus className="w-3.5 h-3.5 text-[#A9A9A9]" />
                          </button>
                          <span className="flex-1 text-center text-[14px] font-bold text-[#303030]">{row.count}</span>
                          <button type="button" onClick={() => clampCount(row.id, 1)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-50 flex-shrink-0">
                            <Plus className="w-3.5 h-3.5 text-[#A9A9A9]" />
                          </button>
                        </div>
                        <div className="flex items-center bg-white rounded-full px-1.5 py-1.5 gap-1.5 w-28 justify-center">
                          <button type="button" onClick={() => clampMarks(row.id, -1)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-50 flex-shrink-0">
                            <Minus className="w-3.5 h-3.5 text-[#A9A9A9]" />
                          </button>
                          <span className="flex-1 text-center text-[14px] font-bold text-[#303030]">{row.marks}</span>
                          <button type="button" onClick={() => clampMarks(row.id, 1)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-50 flex-shrink-0">
                            <Plus className="w-3.5 h-3.5 text-[#A9A9A9]" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-6">
                    <button type="button" onClick={addRow} className="flex items-center gap-3 text-[14px] font-bold text-[#303030] hover:opacity-80 transition-opacity">
                      <div className="w-8 h-8 rounded-full bg-[#303030] flex items-center justify-center">
                        <Plus className="w-4 h-4 text-white" />
                      </div>
                      Add Question Type
                    </button>
                    <div className="text-right text-[12px] text-[#A9A9A9] space-y-1">
                      <p>Total Questions : <span className="font-bold text-[#303030]">{totalQuestions}</span></p>
                      <p>Total Marks : <span className="font-bold text-[#303030]">{totalMarks}</span></p>
                    </div>
                  </div>
                </div>

                <hr className="border-[#F1F1F1]" />

                <div>
                  <label className="block text-[14px] font-semibold text-[#303030] mb-2">
                    Additional Information <span className="text-[#A9A9A9] font-normal">(For better output)</span>
                  </label>
                  <textarea rows={3} value={additionalInfo} onChange={(e) => setAdditionalInfo(e.target.value)}
                    placeholder="e.g Generate a question paper for 3 hour exam duration..."
                    className="w-full px-5 py-4 rounded-2xl border border-[#DEDEDE] bg-[#F6F6F6] text-[14px] text-[#303030] placeholder-[#A9A9A9] focus:outline-none focus:border-gray-300 resize-none transition-colors" />
                </div>
              </div>

              {/* Desktop bottom buttons */}
              <div className="flex items-center justify-between mt-10">
                <button type="button" onClick={() => router.push('/assignments')}
                  className="flex items-center gap-2 px-8 py-3 rounded-full border border-[#DEDEDE] bg-white text-[14px] font-bold text-[#303030] hover:bg-gray-50 transition-colors shadow-sm">
                  <ArrowLeft className="w-4 h-4" />Previous
                </button>
                <button type="button" onClick={handleGenerate} disabled={isSubmitting || isGenerating}
                  className="flex items-center gap-2 px-10 py-3 rounded-full bg-[#1A1A2E] text-white text-[14px] font-bold hover:bg-black transition-all disabled:opacity-60 shadow-lg">
                  {isSubmitting || isGenerating
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</>
                    : <><span>Next</span><ArrowRight className="w-4 h-4" /></>
                  }
                </button>
              </div>
            </div>
          </div>

          {/* ══ MOBILE ══ */}
          <div
            className="md:hidden flex flex-col"
            style={{
              paddingTop: 92,
              /* bottom: buttons(12+46+10) + nav(10+72+10) = 160px */
              paddingBottom: 160,
              paddingLeft: 16,
              paddingRight: 16,
              gap: 24,
            }}
          >
            {/* Mobile sub-header: back + title */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button onClick={() => router.push('/assignments')}
                  style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="15" viewBox="0 0 18 15" fill="none">
                    <path d="M17 7.5H1M1 7.5L7.5 1M1 7.5L7.5 14" stroke="#303030" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <span style={{ fontFamily: 'var(--font-bricolage, inherit)', fontSize: 16, fontWeight: 700, color: '#303030', letterSpacing: '-0.04em' }}>
                  Create Assignment
                </span>
                <div style={{ width: 36 }} />
              </div>
              {/* Progress bar */}
              <div style={{ display: 'flex', gap: 6 }}>
                <div style={{ flex: 1, height: 4, borderRadius: 9999, background: '#303030' }} />
                <div style={{ flex: 1, height: 4, borderRadius: 9999, background: '#EAEAEF' }} />
              </div>
            </div>

            {generationStatus !== 'idle' && (
              <GenerationProgress status={generationStatus} message={generationMessage} />
            )}

            {/* Mobile form card — radius 32, bg rgba(255,255,255,0.5), padding T:32 R:16 B:32 L:16, gap 24 */}
            <div style={{
              borderRadius: 32,
              background: 'rgba(255,255,255,0.5)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              padding: '32px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
            }}>

              {/* Header */}
              <div>
                {/* Title — 176×28 Hug, Bricolage, 700, 20px, -4%, #303030 */}
                <h2 style={{ fontFamily: 'var(--font-bricolage, inherit)', fontSize: 20, fontWeight: 700, color: '#303030', letterSpacing: '-0.04em', lineHeight: '140%' }}>
                  Assignment Details
                </h2>
                {/* Subtitle — 251×20 Hug, Bricolage, 400, 14px, -4%, #5E5E5E 80% */}
                <p style={{ fontFamily: 'var(--font-bricolage, inherit)', fontSize: 14, fontWeight: 400, color: 'rgba(94,94,94,0.8)', letterSpacing: '-0.04em', lineHeight: '140%', marginTop: 2 }}>
                  Basic information about your assignment
                </p>
              </div>

              {/* File upload — radius M-24, border 1.75px dashed (8,8), padding T:24 R:32 B:24 L:32, gap 16 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    borderRadius: 24,
                    border: `1.75px dashed ${dragOver ? '#E8472A' : 'rgba(0,0,0,0.20)'}`,
                    borderStyle: 'dashed',
                    background: dragOver ? '#FFF5F3' : '#F6F6F6',
                    padding: '24px 32px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    gap: 16,
                    cursor: 'pointer',
                  }}
                >
                  {file ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <FileText style={{ width: 18, height: 18, color: '#E8472A' }} />
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#303030' }}>{file.name}</span>
                      <button type="button"
                        onClick={(e) => { e.stopPropagation(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        style={{ color: '#A9A9A9' }}>
                        <X style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Cloud icon in white rounded square */}
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CloudUpload style={{ width: 24, height: 24, color: '#303030' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {/* 253×22 Hug — Bricolage, 500, 16px, -4%, #303030 */}
                        <p style={{ fontFamily: 'var(--font-bricolage, inherit)', fontSize: 16, fontWeight: 500, color: '#303030', letterSpacing: '-0.04em', lineHeight: '140%' }}>Choose a file or drag & drop it here</p>
                        <p style={{ fontFamily: 'var(--font-bricolage, inherit)', fontSize: 14, fontWeight: 400, color: 'rgba(48,48,48,0.4)', letterSpacing: '-0.04em' }}>JPEG, PNG, upto 10MB</p>
                      </div>
                      {/* Browse Files — 127×36, radius XXL-48, padding T:8 R:24 B:8 L:24, gap 4, bg white */}
                      <button type="button"
                        style={{ borderRadius: 9999, border: '1px solid #E8E8E8', background: '#FFFFFF', fontSize: 13, fontWeight: 600, color: '#303030', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px 24px', height: 36 }}>
                        Browse Files
                      </button>
                    </>
                  )}
                </div>
                {/* 317×44 Hug — Bricolage, 500, 16px, -4%, #303030 60% */}
                <p style={{ fontFamily: 'var(--font-bricolage, inherit)', fontSize: 16, fontWeight: 500, color: 'rgba(48,48,48,0.6)', letterSpacing: '-0.04em', lineHeight: '140%', textAlign: 'center' }}>
                  Upload images of your preferred document/ image
                </p>
                <input ref={fileInputRef} type="file" accept=".pdf,.txt,.doc,.docx,.jpg,.jpeg,.png" className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </div>

              {/* Due Date */}
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#303030', marginBottom: 8, fontFamily: 'var(--font-bricolage, inherit)' }}>
                  Due Date
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={dueDate}
                    placeholder="DD-MM-YYYY"
                    onFocus={(e) => { e.currentTarget.type = 'date'; e.currentTarget.min = new Date().toISOString().split('T')[0]; }}
                    onBlur={(e) => { if (!e.currentTarget.value) e.currentTarget.type = 'text'; }}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute"
                    style={{
                      width: '100%',
                      padding: '13px 48px 13px 16px',
                      borderRadius: 16,
                      border: `1px solid ${errors.dueDate ? '#FCA5A5' : '#DEDEDE'}`,
                      background: errors.dueDate ? '#FEF2F2' : '#F6F6F6',
                      fontSize: 14,
                      color: dueDate ? '#303030' : '#A9A9A9',
                      outline: 'none',
                      fontFamily: 'var(--font-bricolage, inherit)',
                    }}
                  />
                  {/* Calendar icon button */}
                  <div style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    width: 32, height: 32, borderRadius: 10, border: '1px solid #DEDEDE',
                    background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    pointerEvents: 'none',
                  }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#303030" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Question Type — Frame 1618872171: Vertical, Fill, gap 16 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#303030', fontFamily: 'var(--font-bricolage, inherit)' }}>
                    Question Type
                  </span>
                  {/* Total Q/Marks — 150×44 Hug, Vertical, Gap 8 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'right' }}>
                    <span style={{ fontSize: 11, color: '#A9A9A9' }}>Total Questions : <strong style={{ color: '#303030' }}>{totalQuestions}</strong></span>
                    <span style={{ fontSize: 11, color: '#A9A9A9' }}>Total Marks : <strong style={{ color: '#303030' }}>{totalMarks}</strong></span>
                  </div>
                </div>

                {/* Question rows — each card: radius M-24, padding 12, gap 12, bg white */}
                {questionRows.map((row) => (
                  <div
                    key={row.id}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: 24,
                      padding: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    {/* Row 1: Dropdown + X */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <select
                          value={row.label}
                          onChange={(e) => updateRow(row.id, 'label', e.target.value)}
                          style={{
                            width: '100%',
                            appearance: 'none',
                            padding: '0 28px 0 0',
                            border: 'none',
                            background: 'transparent',
                            fontSize: 14,
                            fontWeight: 500,
                            color: '#303030',
                            fontFamily: 'var(--font-bricolage, inherit)',
                            letterSpacing: '-0.04em',
                            lineHeight: '140%',
                            outline: 'none',
                            height: 20,
                          }}
                        >
                          {QUESTION_TYPE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        <ChevronDown style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#A9A9A9', pointerEvents: 'none' }} />
                      </div>
                      <button type="button" onClick={() => removeRow(row.id)}
                        style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', flexShrink: 0, color: '#A9A9A9' }}>
                        <X style={{ width: 14, height: 14 }} />
                      </button>
                    </div>

                    {/* Row 2: Controls container — 293×82 Hug, radius 24, padding 8, gap 12, bg #F0F0F0 */}
                    <div style={{
                      display: 'flex',
                      borderRadius: 24,
                      padding: 8,
                      gap: 12,
                      background: '#F0F0F0',
                    }}>
                      {/* No. of Questions column — 132.5×66 Hug, Vertical, gap 8 */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {/* Label — 102×20 Hug, Bricolage, 500, 14px, -4%, #303030, center */}
                        <span style={{ fontFamily: 'var(--font-bricolage, inherit)', fontSize: 14, fontWeight: 500, color: '#303030', letterSpacing: '-0.04em', lineHeight: '140%', textAlign: 'center', height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          No. of Questions
                        </span>
                        {/* Stepper — radius 100, space-between, padding 8, bg white, 38px */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', borderRadius: 100, padding: 8, height: 38 }}>
                          <button type="button" onClick={() => clampCount(row.id, -1)}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                            <Minus style={{ width: 14, height: 14, color: '#A9A9A9' }} />
                          </button>
                          <span style={{ fontFamily: 'var(--font-bricolage, inherit)', fontSize: 14, fontWeight: 700, color: '#303030' }}>{row.count}</span>
                          <button type="button" onClick={() => clampCount(row.id, 1)}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                            <Plus style={{ width: 14, height: 14, color: '#A9A9A9' }} />
                          </button>
                        </div>
                      </div>

                      {/* Marks column — 132.5×66 Hug, Vertical, gap 8 */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {/* Label — Bricolage, 500, 14px, -4%, #303030, center */}
                        <span style={{ fontFamily: 'var(--font-bricolage, inherit)', fontSize: 14, fontWeight: 500, color: '#303030', letterSpacing: '-0.04em', lineHeight: '140%', textAlign: 'center', height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          Marks
                        </span>
                        {/* Stepper — radius 100, space-between, padding 8, bg white, 38px */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', borderRadius: 100, padding: 8, height: 38 }}>
                          <button type="button" onClick={() => clampMarks(row.id, -1)}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                            <Minus style={{ width: 14, height: 14, color: '#A9A9A9' }} />
                          </button>
                          <span style={{ fontFamily: 'var(--font-bricolage, inherit)', fontSize: 14, fontWeight: 700, color: '#303030' }}>{row.marks}</span>
                          <button type="button" onClick={() => clampMarks(row.id, 1)}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                            <Plus style={{ width: 14, height: 14, color: '#A9A9A9' }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Question Type — 164×36 Hug, Gap 8 */}
                <button type="button" onClick={addRow}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    height: 36,
                    background: 'transparent',
                    fontFamily: 'var(--font-bricolage, inherit)',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#303030',
                  }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 9999, background: '#303030', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Plus style={{ width: 14, height: 14, color: '#FFFFFF' }} />
                  </div>
                  Add Question Type
                </button>
              </div>

              {/* Additional Info */}
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#303030', marginBottom: 8, fontFamily: 'var(--font-bricolage, inherit)' }}>
                  Additional Information{' '}
                  <span style={{ fontWeight: 400, color: '#A9A9A9' }}>(For better output)</span>
                </label>
                <textarea rows={3} value={additionalInfo} onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder="e.g Generate a question paper for 3 hour exam duration..."
                  style={{
                    width: '100%', padding: '14px 16px', borderRadius: 16,
                    border: '1px solid #DEDEDE', background: '#F6F6F6',
                    fontSize: 14, color: '#303030', resize: 'none', outline: 'none',
                    fontFamily: 'var(--font-bricolage, inherit)',
                  }}
                />
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
