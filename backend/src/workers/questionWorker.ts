/**
 * Standalone BullMQ worker – only needed when running with Redis.
 * When Redis is unavailable, the main server handles generation inline via in-memory queue.
 * Run: npm run worker
 */
import 'dotenv/config';
import { Worker } from 'bullmq';
import { connectDatabase } from '../config/database';
import { connectRedis, isRedisAvailable } from '../config/redis';
import { processGenerationJob } from '../services/generationService';
import { QuestionGenerationJob } from '../queues/questionQueue';

const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

const startWorker = async () => {
  await connectDatabase();
  await connectRedis();

  if (!isRedisAvailable) {
    console.log('⚠️  Redis not available. Standalone worker not needed – main server handles jobs.');
    console.log('    Start the main server with: npm run dev');
    process.exit(0);
  }

  const worker = new Worker<QuestionGenerationJob>(
    'question-generation',
    async (job) => processGenerationJob(job.data),
    { connection: redisConnection, concurrency: 3 }
  );

  worker.on('completed', (job) => console.log(`✅ Job ${job.id} completed`));
  worker.on('failed', (job, err) => console.error(`❌ Job ${job?.id} failed:`, err.message));

  console.log('🚀 Standalone BullMQ worker started (Redis mode)');
};

startWorker().catch(console.error);
