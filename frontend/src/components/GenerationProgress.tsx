'use client';

import { Loader2, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { GenerationStatus } from '@/types';

const STEPS = [
  'Submitting assignment',
  'Queueing job',
  'AI generating questions',
  'Structuring paper',
  'Ready!',
];

export default function GenerationProgress({ status, message }: { status: GenerationStatus; message: string }) {
  if (status === 'idle') return null;

  const activeStep = status === 'pending' ? 0 : status === 'processing' ? 2 : status === 'completed' ? 4 : 0;

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
          status === 'completed' ? 'bg-emerald-100' : status === 'failed' ? 'bg-red-100' : 'bg-[#FFF0EE]'
        }`}>
          {status === 'completed'
            ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            : status === 'failed'
            ? <XCircle className="w-5 h-5 text-red-500" />
            : <Sparkles className="w-5 h-5 text-[#E8472A] animate-pulse" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-800">
            {status === 'completed' ? 'Paper ready!' : status === 'failed' ? 'Generation failed' : 'Generating...'}
          </p>
          <p className="text-xs text-gray-400 truncate">{message}</p>
        </div>
        {(status === 'processing' || status === 'pending') && (
          <Loader2 className="w-4 h-4 text-[#E8472A] animate-spin flex-shrink-0" />
        )}
      </div>

      <div className="space-y-2">
        {STEPS.map((step, idx) => {
          const done = idx < activeStep;
          const active = idx === activeStep && status !== 'failed';
          return (
            <div key={step} className="flex items-center gap-2.5">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                done ? 'bg-emerald-500' : active ? 'bg-[#E8472A]' : 'bg-gray-200'
              }`}>
                {done ? (
                  <CheckCircle2 className="w-3 h-3 text-white" />
                ) : active ? (
                  <Loader2 className="w-2.5 h-2.5 text-white animate-spin" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                )}
              </div>
              <span className={`text-xs ${done ? 'text-emerald-600 font-medium' : active ? 'text-[#E8472A] font-medium' : 'text-gray-400'}`}>
                {step}
              </span>
            </div>
          );
        })}
      </div>

      {status !== 'failed' && (
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${status === 'completed' ? 'bg-emerald-500 w-full' : 'bg-[#E8472A]'}`}
            style={{ width: status === 'completed' ? '100%' : status === 'processing' ? '65%' : '20%' }}
          />
        </div>
      )}
    </div>
  );
}
