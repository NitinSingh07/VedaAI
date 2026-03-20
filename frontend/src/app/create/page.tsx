'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText, CloudUpload,
  X, AlertCircle, Plus, Minus, ChevronDown, ArrowLeft, ArrowRight,
  Loader2
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import GenerationProgress from '@/components/GenerationProgress';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Figma-matching question type options
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

interface QuestionRow {
  id: string;
  label: string;
  count: number;
  marks: number;
}

interface Errors { [k: string]: string }

const STEPS = ['Upload Material', 'Assignment Details', 'Review & Generate'];

export default function CreateAssessmentPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state (title/subject/grade use defaults since form omits those fields per Figma)
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
  const currentStep = 1;
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    generationStatus, generationMessage,
    currentAssignmentId, setCurrentAssignment, setGenerationStatus,
    addAssignment,
  } = useAssignmentStore();

  useWebSocket(currentAssignmentId);

  // Reset stale generation state when create page opens
  useEffect(() => {
    setGenerationStatus('idle');
  }, []);

  // Auto-navigate on completion
  useEffect(() => {
    if (generationStatus === 'completed' && currentAssignmentId) {
      const t = setTimeout(() => router.push(`/result/${currentAssignmentId}`), 800);
      return () => clearTimeout(t);
    }
  }, [generationStatus, currentAssignmentId]);

  /* ── Question rows helpers ── */
  const addRow = () => setQuestionRows((r) => [
    ...r,
    { id: Date.now().toString(), label: 'Multiple Choice Questions', count: 5, marks: 1 },
  ]);

  const removeRow = (id: string) => setQuestionRows((r) => r.filter((row) => row.id !== id));

  const updateRow = (id: string, field: 'label' | 'count' | 'marks', value: string | number) =>
    setQuestionRows((r) => r.map((row) => row.id === id ? { ...row, [field]: value } : row));

  const clampCount = (id: string, delta: number) => {
    const row = questionRows.find((r) => r.id === id);
    if (!row) return;
    updateRow(id, 'count', Math.max(1, row.count + delta));
  };

  const clampMarks = (id: string, delta: number) => {
    const row = questionRows.find((r) => r.id === id);
    if (!row) return;
    updateRow(id, 'marks', Math.max(1, row.marks + delta));
  };

  const totalQuestions = questionRows.reduce((s, r) => s + r.count, 0);
  const totalMarks = questionRows.reduce((s, r) => s + r.count * r.marks, 0);

  /* ── File drop ── */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  /* ── Validation ── */
  const validate = () => {
    const e: Errors = {};
    if (!dueDate) e.dueDate = 'Due date is required';
    if (questionRows.length === 0) e.questions = 'Add at least one question type';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Submit ── */
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
      <Sidebar />
      <div className="ml-[328px] flex-1 flex flex-col min-h-screen">
        <Topbar title="Assignment" showBack />

        <main className="flex-1 pt-20 pb-12 bg-[#F6F6F6]">
          {/* Header Section (Audit 791: Wide 1103px) */}
          <div className="max-w-[1103px] mx-auto px-8 pt-6 pb-6">
            <div className="flex items-center gap-3">
              {/* Green Dot (Ellipse 10) — #4BC26D with Glow */}
              <div className="w-5 h-5 rounded-full bg-[#E7F6EC] flex items-center justify-center flex-shrink-0" style={{ boxShadow: '0 0 12px rgba(75, 194, 109, 0.4)' }}>
                <div className="w-2.5 h-2.5 rounded-full bg-[#4BC26D]" />
              </div>
              <div>
                <h1
                  className="text-[20px] font-bold text-[#303030] leading-tight"
                  style={{ fontFamily: 'var(--font-bricolage, inherit)' }}
                >
                  Create Assignment
                </h1>
                <p
                  className="text-[14px] font-normal text-[#5E5E5E] mt-0.5 leading-[140%] tracking-[-0.04em]"
                  style={{ fontFamily: 'var(--font-bricolage, inherit)' }}
                >
                  Set up a new assignment for your students
                </p>
              </div>
            </div>
          </div>

          {/* Form Area (Audit 791: Narrow 820px centered) */}
          <div className="max-w-[820px] mx-auto px-8">
            {/* Progress Bar (Matching Form Width) */}
            <div className="flex gap-2 mb-8">
              <div className="flex-1 h-[5px] rounded-full bg-[#303030]" />
              <div className="flex-1 h-[5px] rounded-full bg-[#EAEAEF]" />
            </div>

            {/* Generation progress (shown when generating) */}
            {generationStatus !== 'idle' && (
              <div className="mb-4">
                <GenerationProgress status={generationStatus} message={generationMessage} />
              </div>
            )}

            {/* Form card — Frame 1984077359: Border radius L-32, Background/white-50 (#FFFFFF 50%), padding 32, gap 32 */}
            <div
              className="rounded-[32px] flex flex-col"
              style={{
                background: 'transparent',
                padding: 32,
                gap: 32,
                boxShadow: '0 48px 48px rgba(0,0,0,0.15), 0 16px 48px rgba(0,0,0,0.10)'
              }}
            >
              {/* Header */}
              <div>
                <h2
                  className="text-[16px] font-semibold text-[#303030]"
                  style={{ fontFamily: 'var(--font-bricolage, inherit)' }}
                >
                  Assignment Details
                </h2>
                <p
                  className="text-[14px] font-normal text-[#5E5E5E]/55 mt-1"
                  style={{ fontFamily: 'var(--font-bricolage, inherit)' }}
                >
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
                  style={{
                    borderRadius: 24,
                    border: `1.75px dashed ${dragOver ? '#E8472A' : 'rgba(0,0,0,0.20)'}`,
                    background: dragOver ? '#FFF5F3' : '#FFFFFF',
                    padding: '24px 32px',
                    gap: 16,
                  }}
                >
                  {file ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="w-5 h-5 text-[#E8472A]" />
                      <span className="text-sm font-medium text-gray-700">{file.name}</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
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
                      <button
                        type="button"
                        className="flex items-center justify-center bg-[#F6F6F6] border border-[#DEDEDE] rounded-full text-[14px] font-semibold text-[#303030] hover:bg-gray-50 transition-colors shadow-sm"
                        style={{ width: 127, height: 36 }}
                      >
                        Browse Files
                      </button>
                    </>
                  )}
                </div>
                <p className="text-[14px] text-[#A9A9A9] mt-3 text-center">Upload images of your preferred document/image</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.doc,.docx,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>

              <hr className="border-[#F1F1F1]" />

              {/* Due Date */}
              <div>
                <label className="block text-[14px] font-semibold text-[#303030] mb-2">Due Date</label>
                <div className="relative">
                  <input
                    type="text"
                    value={dueDate}
                    placeholder="Choose a chapter"
                    onFocus={(e) => {
                      e.currentTarget.type = 'date';
                      e.currentTarget.min = new Date().toISOString().split('T')[0];
                    }}
                    onBlur={(e) => {
                      if (!e.currentTarget.value) e.currentTarget.type = 'text';
                    }}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={`w-full px-5 py-3.5 pr-14 rounded-2xl border text-[14px] focus:outline-none focus:border-gray-400 transition-colors [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute ${errors.dueDate ? 'border-red-300 bg-red-50' : 'border-[#DEDEDE] bg-[#F6F6F6]'
                      } ${dueDate ? 'text-[#303030]' : 'text-[#A9A9A9]'}`}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 border border-[#DEDEDE] rounded-xl flex items-center justify-center pointer-events-none bg-white">
                    <svg className="w-4 h-4 text-[#303030]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                      <line x1="12" y1="14" x2="12" y2="17" />
                      <line x1="10.5" y1="15.5" x2="13.5" y2="15.5" />
                    </svg>
                  </div>
                </div>
              </div>

              <hr className="border-[#F1F1F1]" />

              {/* Question Type Table */}
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
                          <select
                            value={row.label}
                            onChange={(e) => updateRow(row.id, 'label', e.target.value)}
                            className="w-full appearance-none px-4 pr-10 rounded-full bg-white text-[14px] text-[#303030] focus:outline-none transition-colors"
                            style={{ paddingTop: 11, paddingBottom: 11, height: 44 }}
                          >
                            {QUESTION_TYPE_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A9A9A9] pointer-events-none" />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          className="w-10 h-10 rounded-2xl border border-transparent flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors flex-shrink-0 text-[#A9A9A9]"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center bg-white rounded-full px-1.5 py-1.5 gap-1.5 w-36 justify-center">
                        <button type="button" onClick={() => clampCount(row.id, -1)}
                          className="w-8 h-8 rounded-full bg-transparent flex items-center justify-center hover:bg-gray-50 transition-colors flex-shrink-0">
                          <Minus className="w-3.5 h-3.5 text-[#A9A9A9]" />
                        </button>
                        <span className="flex-1 text-center text-[14px] font-bold text-[#303030]">{row.count}</span>
                        <button type="button" onClick={() => clampCount(row.id, 1)}
                          className="w-8 h-8 rounded-full bg-transparent flex items-center justify-center hover:bg-gray-50 transition-colors flex-shrink-0">
                          <Plus className="w-3.5 h-3.5 text-[#A9A9A9]" />
                        </button>
                      </div>

                      <div className="flex items-center bg-white rounded-full px-1.5 py-1.5 gap-1.5 w-28 justify-center">
                        <button type="button" onClick={() => clampMarks(row.id, -1)}
                          className="w-8 h-8 rounded-full bg-transparent flex items-center justify-center hover:bg-gray-50 transition-colors flex-shrink-0">
                          <Minus className="w-3.5 h-3.5 text-[#A9A9A9]" />
                        </button>
                        <span className="flex-1 text-center text-[14px] font-bold text-[#303030]">{row.marks}</span>
                        <button type="button" onClick={() => clampMarks(row.id, 1)}
                          className="w-8 h-8 rounded-full bg-transparent flex items-center justify-center hover:bg-gray-50 transition-colors flex-shrink-0">
                          <Plus className="w-3.5 h-3.5 text-[#A9A9A9]" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-6">
                  <button
                    type="button"
                    onClick={addRow}
                    className="flex items-center gap-3 text-[14px] font-bold text-[#303030] hover:opacity-80 transition-opacity"
                  >
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
                <textarea
                  rows={3}
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder="e.g Generate a question paper for 3 hour exam duration..."
                  className="w-full px-5 py-4 rounded-2xl border border-[#DEDEDE] bg-[#F6F6F6] text-[14px] text-[#303030] placeholder-[#A9A9A9] focus:outline-none focus:border-gray-300 resize-none transition-colors"
                />
              </div>
            </div>

            {/* Bottom Buttons */}
            <div className="flex items-center justify-between mt-10">
              <button
                type="button"
                onClick={() => router.push('/assignments')}
                className="flex items-center gap-2 px-8 py-3 rounded-full border border-[#DEDEDE] bg-white text-[14px] font-bold text-[#303030] hover:bg-gray-50 transition-colors shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </button>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isSubmitting || isGenerating}
                className="flex items-center gap-2 px-10 py-3 rounded-full bg-[#1A1A2E] text-white text-[14px] font-bold hover:bg-black transition-all disabled:opacity-60 shadow-lg"
              >
                {isSubmitting || isGenerating
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</>
                  : <><span>Next</span><ArrowRight className="w-4 h-4" /></>
                }
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
