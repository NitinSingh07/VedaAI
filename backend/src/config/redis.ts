import Redis from 'ioredis';
import EventEmitter from 'events';

let redisClient: Redis | null = null;
export let isRedisAvailable = false;

// In-memory pub/sub fallback
export const localEmitter = new EventEmitter();
localEmitter.setMaxListeners(100);

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: () => null, // Don't retry
    });

    redisClient.on('connect', () => {
      isRedisAvailable = true;
      console.log('✅ Redis connected');
    });
    redisClient.on('error', () => {
      isRedisAvailable = false;
    });
  }
  return redisClient;
};

export const connectRedis = async (): Promise<void> => {
  const client = getRedisClient();
  try {
    await client.connect();
    isRedisAvailable = true;
  } catch {
    isRedisAvailable = false;
    console.log('⚠️  Redis unavailable – using in-memory fallback');
  }
};

export const publishEvent = async (channel: string, data: Record<string, unknown>): Promise<void> => {
  // Always emit locally (for in-process WebSocket notifications)
  localEmitter.emit(channel, data);

  // Also publish to Redis if available (for multi-process setups)
  if (isRedisAvailable && redisClient) {
    try {
      await redisClient.publish(channel, JSON.stringify(data));
    } catch {
      // ignore
    }
  }
};
