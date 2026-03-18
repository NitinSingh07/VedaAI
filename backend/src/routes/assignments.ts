import { Router, Request, Response } from 'express';
import multer from 'multer';
import { Assignment } from '../models/Assignment';
import { QuestionPaper } from '../models/QuestionPaper';
import { addJob } from '../queues/questionQueue';
import { getRedisClient, isRedisAvailable } from '../config/redis';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Create assignment + enqueue generation job
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { title, subject, grade, dueDate, questionTypes, additionalInstructions, duration } = req.body;

    if (!title || !subject || !grade || !dueDate || !questionTypes) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const parsedQuestionTypes = typeof questionTypes === 'string'
      ? JSON.parse(questionTypes)
      : questionTypes;

    if (!Array.isArray(parsedQuestionTypes) || parsedQuestionTypes.length === 0) {
      return res.status(400).json({ error: 'At least one question type required' });
    }

    for (const qt of parsedQuestionTypes) {
      if (!qt.type || !qt.count || !qt.marksPerQuestion) {
        return res.status(400).json({ error: 'Invalid question type configuration' });
      }
      if (qt.count < 1 || qt.marksPerQuestion < 1) {
        return res.status(400).json({ error: 'Count and marks must be positive' });
      }
    }

    const totalMarks = parsedQuestionTypes.reduce(
      (sum: number, qt: any) => sum + qt.count * qt.marksPerQuestion, 0
    );

    let fileContent: string | undefined;
    let fileName: string | undefined;
    if (req.file) {
      fileName = req.file.originalname;
      fileContent = req.file.buffer.toString('utf-8');
    }

    const assignment = new Assignment({
      title, subject, grade,
      dueDate: new Date(dueDate),
      questionTypes: parsedQuestionTypes,
      additionalInstructions, fileContent, fileName,
      totalMarks,
      duration: duration ? parseInt(duration) : undefined,
      status: 'pending',
    });
    await assignment.save();

    const jobId = await addJob({ assignmentId: assignment._id.toString() });
    assignment.jobId = jobId;
    await assignment.save();

    return res.status(201).json({
      success: true,
      assignmentId: assignment._id,
      jobId,
      message: 'Assignment created. Generation started.',
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get assignment status
router.get('/:id/status', async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id).select('status jobId title');
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    if (isRedisAvailable) {
      const redis = getRedisClient();
      const cached = await redis.get(`assignment:status:${req.params.id}`).catch(() => null);
      if (cached) return res.json(JSON.parse(cached));
    }

    return res.json({ status: assignment.status, jobId: assignment.jobId });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get assignment details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    return res.json(assignment);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get question paper for assignment
router.get('/:id/paper', async (req: Request, res: Response) => {
  try {
    // Try Redis cache
    if (isRedisAvailable) {
      const redis = getRedisClient();
      const cached = await redis.get(`paper:${req.params.id}`).catch(() => null);
      if (cached) return res.json(JSON.parse(cached));
    }

    const paper = await QuestionPaper.findOne({ assignmentId: req.params.id }).sort({ version: -1 });
    if (!paper) return res.status(404).json({ error: 'Question paper not found' });

    // Cache if Redis available
    if (isRedisAvailable) {
      const redis = getRedisClient();
      redis.setex(`paper:${req.params.id}`, 600, JSON.stringify(paper)).catch(() => null);
    }

    return res.json(paper);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Regenerate question paper
router.post('/:id/regenerate', async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    // Invalidate Redis cache
    if (isRedisAvailable) {
      const redis = getRedisClient();
      redis.del(`paper:${req.params.id}`).catch(() => null);
    }

    assignment.status = 'pending';
    await assignment.save();

    const jobId = await addJob({ assignmentId: assignment._id.toString() });
    assignment.jobId = jobId;
    await assignment.save();

    return res.json({ success: true, jobId, message: 'Regeneration started' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete assignment + its question paper
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    await QuestionPaper.deleteMany({ assignmentId: req.params.id });
    if (isRedisAvailable) {
      const redis = getRedisClient();
      redis.del(`paper:${req.params.id}`).catch(() => null);
      redis.del(`assignment:status:${req.params.id}`).catch(() => null);
    }
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// List all assignments
router.get('/', async (_req: Request, res: Response) => {
  try {
    const assignments = await Assignment.find().sort({ createdAt: -1 }).limit(20);
    return res.json(assignments);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
