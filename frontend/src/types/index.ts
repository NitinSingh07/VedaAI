export type QuestionTypeKey = 'mcq' | 'short_answer' | 'long_answer' | 'true_false' | 'fill_in_blank';

export interface QuestionTypeConfig {
  type: QuestionTypeKey;
  count: number;
  marksPerQuestion: number;
}

export interface AssignmentFormData {
  title: string;
  subject: string;
  grade: string;
  dueDate: string;
  questionTypes: QuestionTypeConfig[];
  additionalInstructions: string;
  duration: string;
  file?: File | null;
}

export interface Question {
  id: string;
  number: number;
  text: string;
  type: QuestionTypeKey;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  options?: string[];
  answer?: string;
}

export interface Section {
  id: string;
  title: string;
  instruction: string;
  questions: Question[];
  totalMarks: number;
}

export interface QuestionPaper {
  _id: string;
  assignmentId: string;
  title: string;
  subject: string;
  grade: string;
  duration?: number;
  totalMarks: number;
  sections: Section[];
  generatedAt: string;
  version: number;
}

export interface Assignment {
  _id: string;
  title: string;
  subject: string;
  grade: string;
  dueDate: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalMarks: number;
  jobId?: string;
  createdAt: string;
}

export type GenerationStatus = 'idle' | 'pending' | 'processing' | 'completed' | 'failed';

export interface WSMessage {
  type: 'connected' | 'status_update' | 'completed' | 'failed';
  assignmentId?: string;
  status?: string;
  message?: string;
  paperId?: string;
  error?: string;
}
