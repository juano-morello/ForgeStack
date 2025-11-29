import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class QueueService implements OnModuleDestroy {
  private connection: IORedis;
  private queues: Map<string, Queue> = new Map();

  constructor(private configService: ConfigService) {
    const redisUrl =
      this.configService.get('REDIS_URL') || 'redis://localhost:6379';
    this.connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
  }

  getQueue(name: string): Queue {
    if (!this.queues.has(name)) {
      this.queues.set(name, new Queue(name, { connection: this.connection }));
    }
    return this.queues.get(name)!;
  }

  async addJob<T>(queueName: string, data: T, options?: { delay?: number }) {
    const queue = this.getQueue(queueName);
    return queue.add(queueName, data, options);
  }

  async onModuleDestroy() {
    await Promise.all([...this.queues.values()].map((q) => q.close()));
    await this.connection.quit();
  }
}

