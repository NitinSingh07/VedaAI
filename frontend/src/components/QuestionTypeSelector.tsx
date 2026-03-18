'use client';

import { Minus, Plus, X, Check } from 'lucide-react';
import { QuestionTypeKey, QuestionTypeConfig } from '@/types';
import { useAssignmentStore } from '@/store/useAssignmentStore';

const QUESTION_TYPES: { key: QuestionTypeKey; label: string; icon: string }[] = [
  { key: 'mcq', label: 'Multiple Choice', icon: '🔘' },
  { key: 'short_answer', label: 'Short Answer', icon: '✏️' },
  { key: 'long_answer', label: 'Long Answer', icon: '📝' },
  { key: 'true_false', label: 'True / False', icon: '✅' },
  { key: 'fill_in_blank', label: 'Fill in Blank', icon: '🔲' },
];

export default function QuestionTypeSelector({ questionTypes }: { questionTypes: QuestionTypeConfig[] }) {
  const { addQuestionType, removeQuestionType, updateQuestionType } = useAssignmentStore();
  const selectedTypes = new Set(questionTypes.map((q) => q.type));

  const toggle = (key: QuestionTypeKey) => {
    if (selectedTypes.has(key)) removeQuestionType(key);
    else addQuestionType({ type: key, count: 5, marksPerQuestion: 2 });
  };

  const update = (type: QuestionTypeKey, field: 'count' | 'marksPerQuestion', value: number) => {
    if (value < 1) return;
    updateQuestionType(type, field, value);
  };

  return (
    <div className="space-y-4">
      {/* Type chips */}
      <div className="flex flex-wrap gap-2">
        {QUESTION_TYPES.map(({ key, label, icon }) => {
          const selected = selectedTypes.has(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-sm font-medium border transition-all duration-150 ${
                selected
                  ? 'bg-[#1A1A2E] text-white border-[#1A1A2E]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="text-base leading-none">{icon}</span>
              <span>{label}</span>
              {selected && <Check className="w-3.5 h-3.5 opacity-80" />}
            </button>
          );
        })}
      </div>

      {/* Config rows */}
      {questionTypes.length > 0 && (
        <div className="space-y-2.5">
          {questionTypes.map((qt) => {
            const meta = QUESTION_TYPES.find((t) => t.key === qt.type)!;
            return (
              <div key={qt.type} className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3">
                <span className="text-lg">{meta.icon}</span>
                <span className="flex-1 text-sm font-medium text-gray-700 truncate">{meta.label}</span>

                <CountControl label="Qty" value={qt.count}
                  onDec={() => update(qt.type, 'count', qt.count - 1)}
                  onInc={() => update(qt.type, 'count', qt.count + 1)} />

                <CountControl label="Marks" value={qt.marksPerQuestion}
                  onDec={() => update(qt.type, 'marksPerQuestion', qt.marksPerQuestion - 1)}
                  onInc={() => update(qt.type, 'marksPerQuestion', qt.marksPerQuestion + 1)} />

                <div className="text-xs font-bold text-[#E8472A] bg-[#FFF0EE] px-2.5 py-1 rounded-xl min-w-[64px] text-center">
                  {qt.count * qt.marksPerQuestion} marks
                </div>

                <button type="button" onClick={() => removeQuestionType(qt.type)} className="w-6 h-6 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors">
                  <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {questionTypes.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-2">Select at least one question type above</p>
      )}
    </div>
  );
}

function CountControl({ label, value, onDec, onInc }: { label: string; value: number; onDec: () => void; onInc: () => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-400 w-8">{label}</span>
      <button type="button" onClick={onDec} className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
        <Minus className="w-3 h-3 text-gray-500" />
      </button>
      <span className="w-7 text-center text-sm font-bold text-gray-800">{value}</span>
      <button type="button" onClick={onInc} className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
        <Plus className="w-3 h-3 text-gray-500" />
      </button>
    </div>
  );
}
