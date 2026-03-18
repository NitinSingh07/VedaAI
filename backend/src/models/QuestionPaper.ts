import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion {
  id: string;
  number: number;
  text: string;
  type: 'mcq' | 'short_answer' | 'long_answer' | 'true_false' | 'fill_in_blank';
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  options?: string[];
  answer?: string;
}

export interface ISection {
  id: string;
  title: string;
  instruction: string;
  questions: IQuestion[];
  totalMarks: number;
}

export interface IQuestionPaper extends Document {
  assignmentId: mongoose.Types.ObjectId;
  title: string;
  subject: string;
  grade: string;
  duration?: number;
  totalMarks: number;
  sections: ISection[];
  generatedAt: Date;
  version: number;
}

const QuestionSchema = new Schema<IQuestion>({
  id: { type: String, required: true },
  number: { type: Number, required: true },
  text: { type: String, required: true },
  type: {
    type: String,
    enum: ['mcq', 'short_answer', 'long_answer', 'true_false', 'fill_in_blank'],
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true,
  },
  marks: { type: Number, required: true },
  options: [{ type: String }],
  answer: { type: String },
});

const SectionSchema = new Schema<ISection>({
  id: { type: String, required: true },
  title: { type: String, required: true },
  instruction: { type: String, required: true },
  questions: [QuestionSchema],
  totalMarks: { type: Number, required: true },
});

const QuestionPaperSchema = new Schema<IQuestionPaper>(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
    title: { type: String, required: true },
    subject: { type: String, required: true },
    grade: { type: String, required: true },
    duration: { type: Number },
    totalMarks: { type: Number, required: true },
    sections: [SectionSchema],
    generatedAt: { type: Date, default: Date.now },
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export const QuestionPaper = mongoose.model<IQuestionPaper>('QuestionPaper', QuestionPaperSchema);
