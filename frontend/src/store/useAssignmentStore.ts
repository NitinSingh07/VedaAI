import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AssignmentFormData,
  Assignment,
  QuestionPaper,
  GenerationStatus,
  QuestionTypeConfig,
  QuestionTypeKey,
} from '@/types';

interface AssignmentState {
  // Form data
  formData: AssignmentFormData;
  // Current assignment being processed
  currentAssignmentId: string | null;
  currentPaperId: string | null;
  // Generation state
  generationStatus: GenerationStatus;
  generationMessage: string;
  // Generated paper
  questionPaper: QuestionPaper | null;
  // History
  assignments: Assignment[];
  // WebSocket
  wsConnected: boolean;

  // Actions
  updateFormField: <K extends keyof AssignmentFormData>(field: K, value: AssignmentFormData[K]) => void;
  addQuestionType: (qt: QuestionTypeConfig) => void;
  removeQuestionType: (type: QuestionTypeKey) => void;
  updateQuestionType: (type: QuestionTypeKey, field: 'count' | 'marksPerQuestion', value: number) => void;
  resetForm: () => void;
  setCurrentAssignment: (id: string) => void;
  setGenerationStatus: (status: GenerationStatus, message?: string) => void;
  setQuestionPaper: (paper: QuestionPaper) => void;
  setWsConnected: (connected: boolean) => void;
  setCurrentPaperId: (id: string) => void;
  addAssignment: (assignment: Assignment) => void;
}

const defaultFormData: AssignmentFormData = {
  title: '',
  subject: '',
  grade: '',
  dueDate: '',
  questionTypes: [],
  additionalInstructions: '',
  duration: '60',
  file: null,
};

export const useAssignmentStore = create<AssignmentState>()(
  persist(
    (set) => ({
      formData: defaultFormData,
      currentAssignmentId: null,
      currentPaperId: null,
      generationStatus: 'idle',
      generationMessage: '',
      questionPaper: null,
      assignments: [],
      wsConnected: false,

      updateFormField: (field, value) =>
        set((state) => ({
          formData: { ...state.formData, [field]: value },
        })),

      addQuestionType: (qt) =>
        set((state) => {
          const exists = state.formData.questionTypes.find((q) => q.type === qt.type);
          if (exists) return state;
          return {
            formData: {
              ...state.formData,
              questionTypes: [...state.formData.questionTypes, qt],
            },
          };
        }),

      removeQuestionType: (type) =>
        set((state) => ({
          formData: {
            ...state.formData,
            questionTypes: state.formData.questionTypes.filter((q) => q.type !== type),
          },
        })),

      updateQuestionType: (type, field, value) =>
        set((state) => ({
          formData: {
            ...state.formData,
            questionTypes: state.formData.questionTypes.map((q) =>
              q.type === type ? { ...q, [field]: value } : q
            ),
          },
        })),

      resetForm: () => set({ formData: defaultFormData }),

      setCurrentAssignment: (id) => set({ currentAssignmentId: id }),

      setGenerationStatus: (status, message = '') =>
        set({ generationStatus: status, generationMessage: message }),

      setQuestionPaper: (paper) => set({ questionPaper: paper }),

      setWsConnected: (connected) => set({ wsConnected: connected }),

      setCurrentPaperId: (id) => set({ currentPaperId: id }),

      addAssignment: (assignment) =>
        set((state) => ({
          assignments: [assignment, ...state.assignments].slice(0, 10),
        })),
    }),
    {
      name: 'vedaai-store',
      partialize: (state) => ({
        assignments: state.assignments,
        currentAssignmentId: state.currentAssignmentId,
        currentPaperId: state.currentPaperId,
      }),
    }
  )
);
