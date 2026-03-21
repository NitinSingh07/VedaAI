'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Download, RefreshCw, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import MobileTopbar from '@/components/MobileTopbar';
import MobileBottomNav from '@/components/MobileBottomNav';
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
            ${q.options?.length ? `<div style="padding-left:16px;display:grid;grid-template-columns:1fr 1fr;gap:2px;margin-top:3px">${q.options.map((o, i) => `<span>${String.fromCharCode(65 + i)}. ${o}</span>`).join('')}</div>` : ''}
          </div>`).join('')}
      `).join('')}
      <div class="end">End of Question Paper</div>
      ${paper.sections.some(s => s.questions.some(q => q.answer)) ? `
        <div class="ak">
          <div class="ak-title">Answer Key</div>
          ${paper.sections.flatMap(s => s.questions.filter(q => q.answer).map(q => `<div class="ak-item"><strong>${q.number}.</strong> ${q.answer}</div>`)).join('')}
        </div>` : ''}
    </body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  /* ── Loading ── */
  if (loading) return (
    <div className="flex min-h-screen bg-[#F0F0F5]">
      <div className="hidden md:block"><Sidebar /></div>
      <MobileTopbar />
      <MobileBottomNav />
      <div className="flex-1 flex flex-col md:ml-[328px]">
        <div className="hidden md:block"><Topbar title="Question Paper" showBack /></div>
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
      <div className="hidden md:block"><Sidebar /></div>
      <MobileTopbar />
      <MobileBottomNav />
      <div className="flex-1 flex flex-col md:ml-[328px]">
        <div className="hidden md:block"><Topbar title="Question Paper" showBack /></div>
        <main className="flex-1 pt-20 flex items-center justify-center">
          <div className="text-center space-y-4 max-w-sm px-6">
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
      {/* Desktop sidebar */}
      <div className="hidden md:block"><Sidebar /></div>

      {/* Mobile topbar + bottom nav */}
      <MobileTopbar />
      <MobileBottomNav />

      <div className="flex-1 flex flex-col min-h-screen md:ml-[328px]">
        {/* Desktop topbar */}
        <div className="hidden md:block">
          <Topbar title="Question Paper" showBack />
        </div>

        {/* ══ DESKTOP ══ */}
        <main className="hidden md:block flex-1 pt-20 pb-12">
          <div
            className="mx-auto flex flex-col"
            style={{ maxWidth: '1100px', borderRadius: '32px', padding: '20px', gap: '12px', backgroundColor: '#5E5E5E' }}
          >
            <div className="flex flex-col"
              style={{ borderRadius: '32px', borderTop: '4px solid rgba(255,255,255,0.15)', padding: '24px 32px', gap: '24px', backgroundColor: 'rgba(24,24,24,0.80)' }}>
              <div className="flex flex-col" style={{ gap: '16px' }}>
                <p className="flex-1 text-white"
                  style={{ fontFamily: 'var(--font-bricolage, inherit)', fontSize: '20px', fontWeight: 700, lineHeight: '140%', letterSpacing: '-0.04em' }}>
                  {`Certainly! Here are customized Question Paper for your CBSE Grade ${paper?.grade} ${paper?.subject} classes on the NCERT chapters:`}
                </p>
                <div className="flex items-center" style={{ gap: '16px' }}>
                  {generationStatus === 'processing' && (
                    <span className="flex items-center gap-1.5 text-xs text-orange-300 font-medium">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />Regenerating...
                    </span>
                  )}
                  <button onClick={handleDownloadPDF}
                    className="flex items-center justify-center bg-white text-[#111] hover:bg-white/90 transition-colors"
                    style={{ width: '200px', height: '44px', borderRadius: '100px', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                    <Download className="w-4 h-4" />Download as PDF
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden"
              style={{ borderRadius: '32px', borderTop: '4px solid #e5e5e5', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {paper && <PaperDocument paper={paper} />}
            </div>
          </div>
        </main>

        {/* ══ MOBILE ══ */}
        {/* Frame 1618872221: Fixed(373px), Top:190px, Left:10px, radius XL-40, padding 9, gap 10, bg white */}
        <div
          className="md:hidden"
          style={{
            paddingTop: 100,
            paddingBottom: 155,
            paddingLeft: 10,
            paddingRight: 10,
          }}
        >
          <div style={{
            background: '#FFFFFF',
            borderRadius: 40,
            padding: 9,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            {/* AI response bubble: radius 32, border-top 4px, padding T:24 R:16 B:24 L:16, gap 12 */}
            <div style={{
              borderRadius: 32,
              borderTop: '4px solid rgba(255,255,255,0.12)',
              background: 'rgba(24,24,24,0.92)',
              padding: '24px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              boxShadow: '0 32px 48px rgba(0,0,0,0.20), 0 16px 48px rgba(0,0,0,0.12)',
            }}>
              {/* AI text: Frame 1984077288 — Fill(323px), Hug(51px), Vertical, Gap 12 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{
                  fontFamily: 'var(--font-bricolage, inherit)',
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  letterSpacing: '-0.04em',
                  lineHeight: '140%',
                }}>
                  {`Certainly! Here are customized Question Paper for your CBSE Grade ${paper?.grade} ${paper?.subject} classes on the NCERT chapters:`}
                </p>

                {/* Download button: Frame 1984077321 — 36×36 Hug, Horizontal, Gap 8 */}
                <button
                  onClick={handleDownloadPDF}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9999,
                    background: 'rgba(255,255,255,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Download style={{ width: 16, height: 16, color: '#FFFFFF' }} />
                </button>

                {generationStatus === 'processing' && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#FCD34D', fontWeight: 500 }}>
                    <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" />
                    Regenerating...
                  </span>
                )}
              </div>
            </div>

            {/* Paper document card */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: 32,
              borderTop: '4px solid #EBEBEB',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}>
              {paper && <PaperDocumentMobile paper={paper} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Paper Document ── */
function PaperDocument({ paper }: { paper: QuestionPaper }) {
  return (
    <div className="flex flex-col" style={{ gap: '24px' }}>
      {/* School Header — Figma: Inter Bold(700), 32px, 160% LH, -4% LS */}
      <div className="text-center" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h1
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '32px',
            fontWeight: 700,
            lineHeight: '160%',
            letterSpacing: '-0.04em',
            color: '#111',
          }}
        >
          {paper.title || 'Delhi Public School'}
        </h1>
        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '24px',
            fontWeight: 600,
            lineHeight: '160%',
            letterSpacing: '-0.04em',
            color: '#333',
          }}
        >
          Subject: {paper.subject}
        </p>
        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '24px',
            fontWeight: 600,
            lineHeight: '160%',
            letterSpacing: '-0.04em',
            color: '#333',
          }}
        >
          Class: {paper.grade}
        </p>
      </div>

      {/* Time & Marks row — Figma: Inter SemiBold(600), 18px, 160%, -4% LS */}
      <div
        className="flex items-center justify-between"
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '18px',
          fontWeight: 600,
          lineHeight: '160%',
          letterSpacing: '-0.04em',
          color: '#555',
          marginTop: '12px',
        }}
      >
        <p>Time Allowed: {paper.duration || '45'} minutes</p>
        <p>Maximum Marks: {paper.totalMarks}</p>
      </div>

      {/* Instruction — Figma: Fill(996) x Hug(29), space-between */}
      <p
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          fontWeight: 400,
          fontStyle: 'italic',
          color: '#555',
        }}
      >All questions are compulsory unless stated otherwise.</p>

      {/* Student info — Figma: Fill(996) x Hug(87) */}
      <div
        className="flex flex-col"
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '18px',
          fontWeight: 600,
          lineHeight: '160%',
          letterSpacing: '-0.04em',
          color: '#333',
          gap: '4px',
        }}
      >
        <p>Name: <span className="inline-block border-b border-gray-400 w-56 align-bottom" /></p>
        <p>Roll Number: <span className="inline-block border-b border-gray-400 w-48 align-bottom" /></p>
        <p>Class: {paper.grade} &nbsp;&nbsp; Section: <span className="inline-block border-b border-gray-400 w-24 align-bottom" /></p>
      </div>

      {/* Sections */}
      {paper.sections.map((sec) => (
        <div key={sec.id} className="flex flex-col" style={{ gap: '12px' }}>
          <div className="text-center">
            <h2
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: '16px',
                lineHeight: '240%',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.05em',
                color: '#111',
              }}
            >{sec.title}</h2>
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                fontStyle: 'italic',
                color: '#777',
              }}
            >{sec.instruction}</p>
          </div>
          <div className="flex flex-col" style={{ gap: '8px' }}>
            {sec.questions.map((q) => <QuestionLine key={q.id} question={q} />)}
          </div>
        </div>
      ))}

      {/* End */}
      <div className="text-center" style={{ borderTop: '2px solid #111', paddingTop: '16px' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 700, color: '#333' }}>End of Question Paper</p>
      </div>

      {/* Answer Key */}
      {paper.sections.some((s) => s.questions.some((q) => q.answer)) && (
        <div className="flex flex-col" style={{ borderTop: '2px solid #111', paddingTop: '20px', gap: '8px' }}>
          <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', lineHeight: '240%', color: '#111' }}>Answer Key:</h2>
          {paper.sections.map((sec) =>
            sec.questions.filter((q) => q.answer).map((q) => (
              <p
                key={q.id}
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  fontWeight: 400,
                  lineHeight: '240%',
                  letterSpacing: '-0.04em',
                  color: '#444'
                }}
              >
                <span style={{ fontWeight: 600 }}>{q.number}.</span> {q.answer}
              </p>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ── Mobile Paper Document ── */
function PaperDocumentMobile({ paper }: { paper: QuestionPaper }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h1 style={{ fontFamily: 'var(--font-bricolage, inherit)', fontSize: 18, fontWeight: 700, letterSpacing: '-0.04em', color: '#111', lineHeight: '140%' }}>
          {paper.title || 'Question Paper'}
        </h1>
        <p style={{ fontFamily: 'var(--font-bricolage, inherit)', fontSize: 13, fontWeight: 500, color: '#555', letterSpacing: '-0.04em' }}>
          Subject: {paper.subject} &nbsp; Class: {paper.grade}
        </p>
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 500, color: '#555', letterSpacing: '-0.04em' }}>
        <span>Time Allowed: {paper.duration || '45'} minutes</span>
        <span>Maximum Marks: {paper.totalMarks}</span>
      </div>

      {/* Instructions */}
      <p style={{ fontFamily: 'var(--font-bricolage, inherit)', fontSize: 12, fontStyle: 'italic', color: '#777' }}>
        All questions are compulsory unless stated otherwise.
      </p>

      {/* Student info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, fontWeight: 500, color: '#333', borderBottom: '1px solid #EBEBEB', paddingBottom: 12 }}>
        <p>Name: <span style={{ display: 'inline-block', borderBottom: '1px solid #999', width: 120, marginLeft: 4 }} /></p>
        <p>Roll Number: <span style={{ display: 'inline-block', borderBottom: '1px solid #999', width: 100, marginLeft: 4 }} /></p>
        <p>Class: {paper.grade} &nbsp; Section: <span style={{ display: 'inline-block', borderBottom: '1px solid #999', width: 60, marginLeft: 4 }} /></p>
      </div>

      {/* Sections */}
      {paper.sections.map((sec) => (
        <div key={sec.id} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-bricolage, inherit)', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#111' }}>
              {sec.title}
            </h2>
            <p style={{ fontFamily: 'var(--font-bricolage, inherit)', fontSize: 11, fontStyle: 'italic', color: '#777', marginTop: 2 }}>
              {sec.instruction}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sec.questions.map((q) => <QuestionLineMobile key={q.id} question={q} />)}
          </div>
        </div>
      ))}

      {/* End */}
      <div style={{ textAlign: 'center', borderTop: '1px solid #EBEBEB', paddingTop: 12 }}>
        <p style={{ fontFamily: 'var(--font-bricolage, inherit)', fontSize: 12, fontWeight: 700, color: '#333' }}>End of Question Paper</p>
      </div>

      {/* Answer Key */}
      {paper.sections.some((s) => s.questions.some((q) => q.answer)) && (
        <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid #EBEBEB', paddingTop: 12, gap: 6 }}>
          <h2 style={{ fontFamily: 'var(--font-bricolage, inherit)', fontWeight: 700, fontSize: 13, color: '#111' }}>Answer Key:</h2>
          {paper.sections.map((sec) =>
            sec.questions.filter((q) => q.answer).map((q) => (
              <p key={q.id} style={{ fontFamily: 'var(--font-bricolage, inherit)', fontSize: 12, color: '#444', lineHeight: '160%' }}>
                <strong>{q.number}.</strong> {q.answer}
              </p>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ── Mobile Question line ── */
function QuestionLineMobile({ question }: { question: Question }) {
  const diff = DIFF[question.difficulty] || question.difficulty;
  return (
    <div style={{ fontFamily: 'var(--font-bricolage, inherit)', fontSize: 12, lineHeight: '160%', color: '#111' }}>
      <p>
        <span style={{ fontWeight: 700 }}>{question.number}. </span>
        <span style={{ color: '#777' }}>[{diff}]</span>
        {' '}{question.text}
        <span style={{ color: '#777' }}> [{question.marks} Marks]</span>
      </p>
      {question.options && question.options.length > 0 && (
        <div style={{ marginLeft: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px', marginTop: 2 }}>
          {question.options.map((opt, idx) => (
            <span key={idx}>
              <span style={{ fontWeight: 700 }}>{String.fromCharCode(65 + idx)}.</span> {opt}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Question line matching Figma format ── */
function QuestionLine({ question }: { question: Question }) {
  const diff = DIFF[question.difficulty] || question.difficulty;
  return (
    <div
      style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '16px',
        fontWeight: 400,
        lineHeight: '240%',
        letterSpacing: '-0.04em',
        color: '#111',
      }}
    >
      <p>
        <span style={{ fontWeight: 700 }}>{question.number}. </span>
        <span style={{ color: '#555' }}>[{diff}]</span>
        {' '}{question.text}
        <span style={{ color: '#555' }}> [{question.marks} Marks]</span>
      </p>
      {question.options && question.options.length > 0 && (
        <div className="ml-6 grid grid-cols-2 gap-x-8 gap-y-1">
          {question.options.map((opt, idx) => (
            <span key={idx}>
              <span style={{ fontWeight: 700 }}>{String.fromCharCode(65 + idx)}.</span> {opt}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
