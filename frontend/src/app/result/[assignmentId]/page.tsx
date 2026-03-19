'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Download, RefreshCw, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { QuestionPaper, Question } from '@/types';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const DIFF: Record<string, string> = { easy: 'Easy', medium: 'Moderate', hard: 'Challenging' };

export default function ResultPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const router = useRouter();
  const paperRef = useRef<HTMLDivElement>(null);

  const [paper, setPaper] = useState<QuestionPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const retryCount = useRef(0);
  const firstLoad = useRef(true);

  const { setCurrentAssignment, setGenerationStatus, generationStatus } = useAssignmentStore();
  useWebSocket(assignmentId);

  const fetchPaper = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/assignments/${assignmentId}/paper`);
      setPaper(data);
      setError(null);
    } catch (err: any) {
      if (err?.response?.status === 404 && retryCount.current < 10) {
        retryCount.current += 1;
        setError('Generating question paper...');
        setTimeout(fetchPaper, 3000);
      } else {
        setError('Failed to load question paper.');
      }
    } finally {
      if (firstLoad.current) { firstLoad.current = false; setLoading(false); }
    }
  };

  useEffect(() => {
    if (assignmentId) { setCurrentAssignment(assignmentId); fetchPaper(); }
  }, [assignmentId]);

  useEffect(() => {
    if (generationStatus === 'completed') fetchPaper();
  }, [generationStatus]);

  const handleRegenerate = async () => {
    setRegenerating(true);
    setGenerationStatus('pending', 'Starting regeneration...');
    try {
      await axios.post(`${API_URL}/assignments/${assignmentId}/regenerate`);
      toast.success('Regeneration started!');
      setGenerationStatus('processing', 'AI is regenerating...');
      retryCount.current = 0;
      firstLoad.current = true;
      setRegenerating(false);
    } catch {
      toast.error('Failed to start regeneration');
      setRegenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    const win = window.open('', '_blank');
    if (!win || !paper) return;
    win.document.write(`<!DOCTYPE html><html><head>
      <title>${paper.title}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Arial,sans-serif;font-size:12px;color:#111;padding:20mm}
        .header{text-align:center;border-bottom:2px solid #111;padding-bottom:12px;margin-bottom:14px}
        .school{font-size:15px;font-weight:700}
        .sub{font-size:12px;margin-top:3px}
        .meta{display:flex;justify-content:space-between;font-size:11px;margin-bottom:8px}
        .instr{font-size:11px;font-style:italic;margin-bottom:12px;border-bottom:1px solid #ccc;padding-bottom:10px}
        .student{font-size:11px;margin-bottom:14px;line-height:2}
        .sec-title{font-weight:700;font-size:12px;text-transform:uppercase;margin:14px 0 2px}
        .sec-instr{font-size:11px;font-style:italic;margin-bottom:8px;color:#555}
        .q{font-size:11px;margin:5px 0;padding-left:16px;text-indent:-16px}
        .end{text-align:center;font-weight:700;border-top:1px solid #111;padding-top:10px;margin-top:14px}
        .ak{margin-top:16px;border-top:2px solid #111;padding-top:12px}
        .ak-title{font-weight:700;font-size:12px;margin-bottom:8px}
        .ak-item{font-size:11px;margin:3px 0}
        @page{margin:15mm}
      </style></head><body>
      <div class="header">
        <div class="school">${paper.title}</div>
        <div class="sub">Subject: ${paper.subject} &nbsp;&nbsp; Class: ${paper.grade}</div>
      </div>
      <div class="meta">
        <span>${paper.duration ? `Time Allowed: ${paper.duration} minutes` : ''}</span>
        <span>Maximum Marks: ${paper.totalMarks}</span>
      </div>
      <p class="instr">All questions are compulsory unless stated otherwise.</p>
      <div class="student">
        Name: ________________________<br/>
        Roll Number: ________________<br/>
        Class: ${paper.grade} &nbsp;&nbsp; Section: ________
      </div>
      ${paper.sections.map(sec => `
        <div class="sec-title">${sec.title}</div>
        <div class="sec-instr">${sec.instruction}</div>
        ${sec.questions.map(q => `
          <div class="q">${q.number}. [${DIFF[q.difficulty] || q.difficulty}] ${q.text} [${q.marks} Marks]
            ${q.options?.length ? `<div style="padding-left:16px;display:grid;grid-template-columns:1fr 1fr;gap:2px;margin-top:3px">${q.options.map((o,i)=>`<span>${String.fromCharCode(65+i)}. ${o}</span>`).join('')}</div>` : ''}
          </div>`).join('')}
      `).join('')}
      <div class="end">End of Question Paper</div>
      ${paper.sections.some(s=>s.questions.some(q=>q.answer)) ? `
        <div class="ak">
          <div class="ak-title">Answer Key</div>
          ${paper.sections.flatMap(s=>s.questions.filter(q=>q.answer).map(q=>`<div class="ak-item"><strong>${q.number}.</strong> ${q.answer}</div>`)).join('')}
        </div>` : ''}
    </body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  /* ── Loading ── */
  if (loading) return (
    <div className="flex min-h-screen bg-[#F0F0F5]">
      <Sidebar />
      <div className="ml-[251px] flex-1 flex flex-col">
        <Topbar title="Question Paper" showBack />
        <main className="flex-1 pt-20 flex items-center justify-center">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#E8472A] animate-spin mx-auto" />
            <p className="text-sm text-gray-500">Loading question paper...</p>
          </div>
        </main>
      </div>
    </div>
  );

  /* ── Error ── */
  if (error && !paper) return (
    <div className="flex min-h-screen bg-[#F0F0F5]">
      <Sidebar />
      <div className="ml-[251px] flex-1 flex flex-col">
        <Topbar title="Question Paper" showBack />
        <main className="flex-1 pt-20 flex items-center justify-center">
          <div className="text-center space-y-4 max-w-sm">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
            <p className="text-sm font-medium text-gray-700">{error}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => router.push('/assignments')}
                className="px-5 py-2 rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50">
                ← Back
              </button>
              <button onClick={() => { retryCount.current = 0; setLoading(true); fetchPaper(); }}
                className="px-5 py-2 rounded-full bg-[#1A1A2E] text-white text-sm font-semibold hover:bg-black">
                Retry
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );

  /* ── Main ── */
  return (
    <div className="flex min-h-screen bg-[#F0F0F5]">
      <Sidebar />
      <div className="ml-[251px] flex-1 flex flex-col">
        <Topbar title="Question Paper" showBack />

        <main className="flex-1 pt-20 pb-12">
          {/* Dark AI message panel */}
          <div className="bg-[#1A1A2E] px-8 py-5 flex items-start justify-between gap-6">
            <p className="text-sm text-gray-200 leading-relaxed flex-1">
              Here are the customized question paper for your {paper?.subject} — Grade {paper?.grade}
              {paper?.title ? ` (${paper.title})` : ''}:
            </p>
            <div className="flex items-center gap-2 flex-shrink-0">
              {generationStatus === 'processing' && (
                <span className="flex items-center gap-1.5 text-xs text-orange-300 font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Regenerating...
                </span>
              )}
              <button
                onClick={handleRegenerate}
                disabled={regenerating || generationStatus === 'processing'}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
                Regenerate
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-[#1A1A2E] text-sm font-semibold hover:bg-gray-100 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download as PDF
              </button>
            </div>
          </div>

          {/* Back link */}
          <div className="px-8 pt-5 pb-2">
            <button
              onClick={() => router.push('/assignments')}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Assignments
            </button>
          </div>

          {/* Paper document */}
          <div className="max-w-3xl mx-auto px-8 pb-8" ref={paperRef}>
            {paper && <PaperDocument paper={paper} />}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ── Paper Document ── */
function PaperDocument({ paper }: { paper: QuestionPaper }) {
  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-gray-100"
      style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
      {/* Header */}
      <div className="text-center px-10 pt-8 pb-6 border-b-2 border-gray-900">
        <h1 className="text-base font-bold text-gray-900">{paper.title}</h1>
        <p className="text-sm text-gray-700 mt-1">Subject: {paper.subject}</p>
        <p className="text-sm text-gray-700">Class: {paper.grade}</p>
      </div>

      <div className="px-10 py-6 space-y-4">
        {/* Time + Marks */}
        <div className="flex justify-between text-sm text-gray-700">
          {paper.duration
            ? <span>Time Allowed: {paper.duration} minutes</span>
            : <span />}
          <span>Maximum Marks: {paper.totalMarks}</span>
        </div>

        {/* Instruction */}
        <p className="text-sm text-gray-600 italic border-b border-gray-200 pb-4">
          All questions are compulsory unless stated otherwise.
        </p>

        {/* Student info */}
        <div className="text-sm text-gray-700 space-y-1.5 border-b border-gray-200 pb-5">
          <p>Name: <span className="inline-block border-b border-gray-500 w-44 align-bottom" /></p>
          <p>Roll Number: <span className="inline-block border-b border-gray-500 w-36 align-bottom" /></p>
          <p>Class: {paper.grade} &nbsp;&nbsp; Section: <span className="inline-block border-b border-gray-500 w-16 align-bottom" /></p>
        </div>

        {/* Sections */}
        {paper.sections.map((sec) => (
          <div key={sec.id} className="space-y-3">
            <div>
              <h2 className="font-bold text-sm text-gray-900 text-center uppercase tracking-wide mt-2">{sec.title}</h2>
              <p className="text-xs text-gray-500 italic text-center">{sec.instruction}</p>
            </div>
            <div className="space-y-2">
              {sec.questions.map((q) => <QuestionLine key={q.id} question={q} />)}
            </div>
          </div>
        ))}

        {/* End */}
        <div className="border-t-2 border-gray-900 pt-4 text-center">
          <p className="text-sm font-bold text-gray-800">End of Question Paper</p>
        </div>

        {/* Answer Key */}
        {paper.sections.some((s) => s.questions.some((q) => q.answer)) && (
          <div className="border-t-2 border-gray-900 pt-5 space-y-3">
            <h2 className="font-bold text-sm text-gray-900">Answer Key:</h2>
            {paper.sections.map((sec) =>
              sec.questions.filter((q) => q.answer).map((q) => (
                <p key={q.id} className="text-sm text-gray-700">
                  <span className="font-semibold">{q.number}.</span> {q.answer}
                </p>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Question line matching Figma format ── */
function QuestionLine({ question }: { question: Question }) {
  const diff = DIFF[question.difficulty] || question.difficulty;
  return (
    <div className="text-sm text-gray-800">
      <p>
        <span className="font-medium">{question.number}. </span>
        <span className="text-gray-500">[{diff}]</span>
        {' '}{question.text}
        <span className="text-gray-500"> [{question.marks} Marks]</span>
      </p>
      {question.options && question.options.length > 0 && (
        <div className="mt-1.5 ml-4 grid grid-cols-2 gap-1">
          {question.options.map((opt, idx) => (
            <span key={idx} className="text-sm text-gray-600">
              <span className="font-medium">{String.fromCharCode(65 + idx)}.</span> {opt}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
