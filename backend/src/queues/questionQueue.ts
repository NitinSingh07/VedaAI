import EventEmitter from 'events';
import { isRedisAvailable } from '../config/redis';

export interface QuestionGenerationJob {
  assignmentId: string;
}

// In-memory job emitter for when Redis is unavailable
export const jobEmitter = new EventEmitter();

export type JobHandler = (job: QuestionGenerationJob) => Promise<void>;
let registeredHandler: JobHandler | null = null;

export const registerWorkerHandler = (handler: JobHandler) => {
  registeredHandler = handler;
};

// BullMQ queue (only created when Redis is available)
let _bullQueue: any = null;

export const getBullQueue = () => _bullQueue;

export const initQueue = async () => {
  if (!isRedisAvailable) return;
  try {
    const { Queue } = await import('bullmq');
    const redisConnection = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    };
    _bullQueue = new Queue<QuestionGenerationJob>('question-generation', {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 50,
        removeOnFail: 20,
      },
    });
    console.log('✅ BullMQ queue initialized');
  } catch {
    console.log('⚠️  BullMQ unavailable – using in-memory queue');
  }
};

export const addJob = async (data: QuestionGenerationJob): Promise<string> => {
  const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  if (_bullQueue) {
    const job = await _bullQueue.add('generate', data);
    return job.id || jobId;
  }

  // In-memory: delay 1.5s so frontend WS can connect + subscribe first
  setTimeout(async () => {
    if (registeredHandler) {
      try {
        await registeredHandler(data);
      } catch (err) {
        console.error('In-memory job failed:', err);
      }
    }
  }, 1500);

  return jobId;
};
