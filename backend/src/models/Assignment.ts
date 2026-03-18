import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestionType {
  type: 'mcq' | 'short_answer' | 'long_answer' | 'true_false' | 'fill_in_blank';
  count: number;
  marksPerQuestion: number;
}

export interface IAssignment extends Document {
  title: string;
  subject: string;
  grade: string;
  dueDate: Date;
  questionTypes: IQuestionType[];
  additionalInstructions?: string;
  fileContent?: string;
  fileName?: string;
  totalMarks: number;
  duration?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  jobId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionTypeSchema = new Schema<IQuestionType>({
  type: {
    type: String,
    enum: ['mcq', 'short_answer', 'long_answer', 'true_false', 'fill_in_blank'],
    required: true,
  },
  count: { type: Number, required: true, min: 1 },
  marksPerQuestion: { type: Number, required: true, min: 1 },
});

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true },
    subject: { type: String, required: true },
    grade: { type: String, required: true },
    dueDate: { type: Date, required: true },
    questionTypes: { type: [QuestionTypeSchema], required: true },
    additionalInstructions: { type: String },
    fileContent: { type: String },
    fileName: { type: String },
    totalMarks: { type: Number, required: true },
    duration: { type: Number },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    jobId: { type: String },
  },
  { timestamps: true }
);

export const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema);
