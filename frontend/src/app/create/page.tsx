'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar, FileText, CloudUpload,
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
      <div className="ml-[304px] flex-1 flex flex-col min-h-screen">
        <Topbar title="Assignment" showBack />

        <main className="flex-1 pt-14 pb-12">
          {/* Page header */}
          <div className="px-8 pt-6 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 flex-shrink-0" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 leading-tight">Create Assignment</h1>
                <p className="text-sm text-gray-400 mt-0.5">Set up a new assignment for your students</p>
              </div>
            </div>

            {/* Progress bar — 2 bars only, no text, matching Figma */}
            <div className="flex gap-2 mt-5">
              <div className="flex-1 h-[5px] rounded-full bg-[#1A1A2E]" />
              <div className="flex-1 h-[5px] rounded-full bg-gray-200" />
            </div>
          </div>

          {/* Generation progress (shown when generating) */}
          {generationStatus !== 'idle' && (
            <div className="px-8 mb-4">
              <GenerationProgress status={generationStatus} message={generationMessage} />
            </div>
          )}

          {/* Form card */}
          <div className="mx-8">
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
              {/* Card content — no header divider, one seamless section like Figma */}
              <div className="px-8 pt-7 pb-8 space-y-6">

                {/* Header */}
                <div>
                  <h2 className="text-base font-bold text-gray-900">Assignment Details</h2>
                  <p className="text-sm text-gray-400 mt-0.5">Basic information about your assignment</p>
                </div>

                {/* File Upload */}
                <div>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border border-dashed rounded-2xl py-7 px-6 text-center cursor-pointer transition-all ${dragOver ? 'border-[#E8472A] bg-[#FFF5F3]' : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}
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
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <CloudUpload className="w-5 h-5 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Choose a file or drag & drop it here</p>
                        <p className="text-xs text-gray-400 mb-4">JPEG, PNG, upto 10MB</p>
                        <button
                          type="button"
                          className="px-5 py-1.5 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                        >
                          Browse Files
                        </button>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-3 text-center">Upload images of your preferred document/image</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,.doc,.docx,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </div>

                <hr className="border-gray-100" />

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Due Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={dueDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setDueDate(e.target.value)}
                      placeholder="Choose a chapter"
                      className={`w-full px-4 py-3 pr-12 rounded-2xl border text-sm focus:outline-none focus:border-gray-400 transition-colors [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden ${errors.dueDate ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
                        } text-gray-700`}
                    />
                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  {errors.dueDate && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />{errors.dueDate}
                    </p>
                  )}
                </div>

                <hr className="border-gray-100" />

                {/* Question Type Table */}
                <div>
                  {/* Table header */}
                  <div className="grid grid-cols-[1fr_auto_auto] gap-4 mb-3 px-1">
                    <span className="text-sm font-bold text-gray-900">Question Type</span>
                    <span className="text-sm font-bold text-gray-900 w-32 text-center">No. of Questions</span>
                    <span className="text-sm font-bold text-gray-900 w-24 text-center">Marks</span>
                  </div>

                  {/* Rows */}
                  <div className="space-y-2.5">
                    {questionRows.map((row) => (
                      <div key={row.id} className="grid grid-cols-[1fr_auto_auto] gap-4 items-center">
                        {/* Type dropdown + X */}
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <select
                              value={row.label}
                              onChange={(e) => updateRow(row.id, 'label', e.target.value)}
                              className="w-full appearance-none px-4 py-2.5 pr-9 rounded-2xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:border-gray-300 transition-colors"
                            >
                              {QUESTION_TYPE_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeRow(row.id)}
                            className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors flex-shrink-0"
                          >
                            <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                          </button>
                        </div>

                        {/* Count stepper */}
                        <div className="flex items-center gap-1.5 w-32 justify-center">
                          <button type="button" onClick={() => clampCount(row.id, -1)}
                            className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                            <Minus className="w-3 h-3 text-gray-500" />
                          </button>
                          <span className="w-8 text-center text-sm font-bold text-gray-800">{row.count}</span>
                          <button type="button" onClick={() => clampCount(row.id, 1)}
                            className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                            <Plus className="w-3 h-3 text-gray-500" />
                          </button>
                        </div>

                        {/* Marks stepper */}
                        <div className="flex items-center gap-1.5 w-24 justify-center">
                          <button type="button" onClick={() => clampMarks(row.id, -1)}
                            className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                            <Minus className="w-3 h-3 text-gray-500" />
                          </button>
                          <span className="w-6 text-center text-sm font-bold text-gray-800">{row.marks}</span>
                          <button type="button" onClick={() => clampMarks(row.id, 1)}
                            className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                            <Plus className="w-3 h-3 text-gray-500" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {errors.questions && (
                    <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />{errors.questions}
                    </p>
                  )}

                  {/* Add row + totals */}
                  <div className="flex items-center justify-between mt-4">
                    <button
                      type="button"
                      onClick={addRow}
                      className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#1A1A2E] flex items-center justify-center">
                        <Plus className="w-3.5 h-3.5 text-white" />
                      </div>
                      Add Question Type
                    </button>
                    <div className="text-right text-sm text-gray-500 space-y-0.5">
                      <p>Total Questions : <span className="font-bold text-gray-900">{totalQuestions}</span></p>
                      <p>Total Marks : <span className="font-bold text-gray-900">{totalMarks}</span></p>
                    </div>
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Additional Information */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Additional Information <span className="text-gray-400 font-normal">(For better output)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    placeholder="e.g Generate a question paper for 3 hour exam duration..."
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-300 resize-none transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Previous / Next (Generate) */}
          <div className="flex items-center justify-between px-8 mt-6">
            <button
              type="button"
              onClick={() => router.push('/assignments')}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isSubmitting || isGenerating}
              className="flex items-center gap-2 px-8 py-2.5 rounded-full bg-[#1A1A2E] text-white text-sm font-semibold hover:bg-black transition-all disabled:opacity-60"
            >
              {isSubmitting || isGenerating
                ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</>
                : <><span>Next</span><ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
