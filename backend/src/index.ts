import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { connectDatabase } from './config/database';
import { connectRedis, isRedisAvailable, localEmitter } from './config/redis';
import { initQueue } from './queues/questionQueue';
import { wsService } from './services/websocket';
import assignmentRoutes from './routes/assignments';

// Register the in-memory worker handler
import './services/generationService';

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/assignments', assignmentRoutes);

app.get('/health', (_req, res) => res.json({
  status: 'ok',
  redis: isRedisAvailable,
  groq_key_set: !!process.env.GROQ_API_KEY,
  timestamp: new Date().toISOString(),
}));


wsService.initialize(server);

// Forward local emitter events to WebSocket clients
const setupLocalEventForwarding = () => {
  // Listen for all assignment:* events via localEmitter
  const originalEmit = localEmitter.emit.bind(localEmitter);
  localEmitter.emit = (event: string, ...args: any[]) => {
    const result = originalEmit(event, ...args);
    if (typeof event === 'string' && event.startsWith('assignment:')) {
      const assignmentId = event.replace('assignment:', '');
      const data = args[0] as Record<string, unknown>;
      wsService.notifyAssignment(assignmentId, data);
    }
    return result;
  };
};

// Redis pub/sub (only when Redis is available)
const setupRedisSubscriber = async () => {
  if (!isRedisAvailable) return;
  try {
    const { getRedisClient } = await import('./config/redis');
    const subscriber = getRedisClient().duplicate();
    await subscriber.connect();
    await subscriber.psubscribe('assignment:*');
    subscriber.on('pmessage', (_pattern: string, channel: string, message: string) => {
      try {
        const data = JSON.parse(message);
        const assignmentId = channel.replace('assignment:', '');
        wsService.notifyAssignment(assignmentId, data);
      } catch {
        // ignore
      }
    });
    console.log('📡 Redis pub/sub subscriber ready');
  } catch {
    // ignore
  }
};

const start = async () => {
  await connectDatabase();
  await connectRedis();
  setupLocalEventForwarding();
  await initQueue();
  await setupRedisSubscriber();

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 WebSocket at ws://localhost:${PORT}/ws`);
    console.log(`🔧 Redis: ${isRedisAvailable ? 'connected' : 'using in-memory fallback'}`);
  });
};

start().catch(console.error);
