import { Assignment } from '../models/Assignment';
import { QuestionPaper } from '../models/QuestionPaper';
import { generateQuestionPaper } from './aiService';
import { publishEvent } from '../config/redis';
import { QuestionGenerationJob, registerWorkerHandler } from '../queues/questionQueue';

export const processGenerationJob = async (data: QuestionGenerationJob): Promise<void> => {
  const { assignmentId } = data;
  console.log(`⚙️  Processing generation for assignment ${assignmentId}`);

  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw new Error(`Assignment ${assignmentId} not found`);

  assignment.status = 'processing';
  await assignment.save();

  await publishEvent(`assignment:${assignmentId}`, {
    type: 'status_update',
    status: 'processing',
    message: 'AI is generating your question paper...',
  });

  try {
    const generated = await generateQuestionPaper(assignment);

    const existingPaper = await QuestionPaper.findOne({ assignmentId });
    const version = existingPaper ? existingPaper.version + 1 : 1;
    if (existingPaper) await existingPaper.deleteOne();

    const paper = new QuestionPaper({
      assignmentId,
      title: generated.title,
      subject: assignment.subject,
      grade: assignment.grade,
      duration: assignment.duration,
      totalMarks: generated.totalMarks,
      sections: generated.sections,
      version,
    });
    await paper.save();

    assignment.status = 'completed';
    await assignment.save();

    await publishEvent(`assignment:${assignmentId}`, {
      type: 'completed',
      status: 'completed',
      paperId: paper._id.toString(),
      message: 'Question paper generated successfully!',
    });

    console.log(`✅ Generation completed. Paper ID: ${paper._id}`);
  } catch (err: any) {
    console.error(`❌ Generation failed for ${assignmentId}:`, err?.message || err);
    console.error('Full error:', err);

    assignment.status = 'failed';
    await assignment.save();

    const userMessage = err?.status === 401
      ? 'Invalid OpenAI API key. Check OPENAI_API_KEY in .env'
      : err?.status === 429
      ? 'OpenAI rate limit / quota exceeded. Check your plan.'
      : err?.status === 404
      ? 'OpenAI model not found. Check model name.'
      : `Generation failed: ${err?.message || 'Unknown error'}`;

    await publishEvent(`assignment:${assignmentId}`, {
      type: 'failed',
      status: 'failed',
      message: userMessage,
      error: err.message,
    });

    throw err;
  }
};

// Register handler for in-memory queue
registerWorkerHandler(processGenerationJob);
