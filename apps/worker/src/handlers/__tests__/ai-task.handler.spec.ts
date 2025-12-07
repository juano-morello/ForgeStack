/**
 * AI Task Handler Tests
 */

import { Job } from 'bullmq';
import { handleAITask, AITaskJobData } from '../ai-task.handler';

// Mock AI SDK
jest.mock('ai', () => ({
  generateText: jest.fn(),
  generateObject: jest.fn(),
}));

jest.mock('@ai-sdk/openai', () => ({
  openai: jest.fn((model: string) => ({ provider: 'openai', model })),
}));

jest.mock('@ai-sdk/anthropic', () => ({
  anthropic: jest.fn((model: string) => ({ provider: 'anthropic', model })),
}));

// Mock database context
jest.mock('@forgestack/db', () => ({
  withServiceContext: jest.fn(),
}));

// Mock the logger
jest.mock('../../telemetry/logger', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
}));

import { generateText, generateObject } from 'ai';

const mockGenerateText = generateText as jest.MockedFunction<typeof generateText>;
const mockGenerateObject = generateObject as jest.MockedFunction<typeof generateObject>;

describe('AITaskHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleAITask - generate', () => {
    it('should process generate task successfully', async () => {
      mockGenerateText.mockResolvedValue({
        text: 'Generated text response',
        usage: { totalTokens: 150, inputTokens: 50, outputTokens: 100 },
      } as any);

      const jobData: AITaskJobData = {
        taskType: 'generate',
        orgId: 'org-123',
        userId: 'user-123',
        input: {
          prompt: 'Write a story about a robot',
        },
        options: {
          provider: 'openai',
          model: 'gpt-4o-mini',
        },
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<AITaskJobData>;

      const result = await handleAITask(mockJob);

      expect(result.success).toBe(true);
      expect(result.taskType).toBe('generate');
      expect(result.output).toBe('Generated text response');
      expect(result.tokensUsed).toBe(150);
      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: 'Write a story about a robot',
          temperature: 0.7,
          maxOutputTokens: 4096,
        })
      );
    });

    it('should process generate task with context', async () => {
      mockGenerateText.mockResolvedValue({
        text: 'Generated text with context',
        usage: { totalTokens: 200, inputTokens: 100, outputTokens: 100 },
      } as any);

      const jobData: AITaskJobData = {
        taskType: 'generate',
        orgId: 'org-123',
        userId: 'user-123',
        input: {
          prompt: 'Continue the story',
          context: 'Once upon a time...',
        },
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<AITaskJobData>;

      const result = await handleAITask(mockJob);

      expect(result.success).toBe(true);
      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: 'Once upon a time...\n\nContinue the story',
        })
      );
    });
  });

  describe('handleAITask - summarize', () => {
    it('should process summarize task successfully', async () => {
      mockGenerateText.mockResolvedValue({
        text: 'This is a summary',
        usage: { totalTokens: 100, inputTokens: 80, outputTokens: 20 },
      } as any);

      const jobData: AITaskJobData = {
        taskType: 'summarize',
        orgId: 'org-123',
        userId: 'user-123',
        input: {
          prompt: 'Long document text here...',
        },
        options: {
          provider: 'anthropic',
        },
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<AITaskJobData>;

      const result = await handleAITask(mockJob);

      expect(result.success).toBe(true);
      expect(result.taskType).toBe('summarize');
      expect(result.output).toBe('This is a summary');
      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.3, // Lower temperature for summarization
          maxOutputTokens: 2048,
        })
      );
    });
  });

  describe('handleAITask - extract', () => {
    it('should process extract task successfully', async () => {
      mockGenerateObject.mockResolvedValue({
        object: {
          name: 'John Doe',
          age: 30,
          email: 'john@example.com',
        },
        usage: { totalTokens: 120, inputTokens: 70, outputTokens: 50 },
      } as any);

      const jobData: AITaskJobData = {
        taskType: 'extract',
        orgId: 'org-123',
        userId: 'user-123',
        input: {
          prompt: 'Extract person information',
          context: 'John Doe is 30 years old. Email: john@example.com',
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              age: { type: 'number' },
              email: { type: 'string' },
            },
          },
        },
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<AITaskJobData>;

      const result = await handleAITask(mockJob);

      expect(result.success).toBe(true);
      expect(result.taskType).toBe('extract');
      expect(result.output).toEqual({
        name: 'John Doe',
        age: 30,
        email: 'john@example.com',
      });
      expect(result.tokensUsed).toBe(120);
      expect(mockGenerateObject).toHaveBeenCalled();
    });

    it('should fail extract task without schema', async () => {
      const jobData: AITaskJobData = {
        taskType: 'extract',
        orgId: 'org-123',
        userId: 'user-123',
        input: {
          prompt: 'Extract data',
        },
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<AITaskJobData>;

      const result = await handleAITask(mockJob);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Schema is required');
    });
  });

  describe('handleAITask - error handling', () => {
    it('should handle unsupported task type', async () => {
      const jobData: AITaskJobData = {
        taskType: 'invalid' as any,
        orgId: 'org-123',
        userId: 'user-123',
        input: {
          prompt: 'Test',
        },
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<AITaskJobData>;

      const result = await handleAITask(mockJob);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported task type');
    });

    it('should handle AI SDK errors', async () => {
      mockGenerateText.mockRejectedValue(new Error('API rate limit exceeded'));

      const jobData: AITaskJobData = {
        taskType: 'generate',
        orgId: 'org-123',
        userId: 'user-123',
        input: {
          prompt: 'Test prompt',
        },
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<AITaskJobData>;

      const result = await handleAITask(mockJob);

      expect(result.success).toBe(false);
      expect(result.error).toBe('API rate limit exceeded');
    });
  });

  describe('handleAITask - provider options', () => {
    it('should use default provider when not specified', async () => {
      mockGenerateText.mockResolvedValue({
        text: 'Response',
        usage: { totalTokens: 50, inputTokens: 25, outputTokens: 25 },
      } as any);

      const jobData: AITaskJobData = {
        taskType: 'generate',
        orgId: 'org-123',
        userId: 'user-123',
        input: {
          prompt: 'Test',
        },
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<AITaskJobData>;

      await handleAITask(mockJob);

      expect(mockGenerateText).toHaveBeenCalled();
    });

    it('should use custom temperature and maxTokens', async () => {
      mockGenerateText.mockResolvedValue({
        text: 'Response',
        usage: { totalTokens: 50, inputTokens: 25, outputTokens: 25 },
      } as any);

      const jobData: AITaskJobData = {
        taskType: 'generate',
        orgId: 'org-123',
        userId: 'user-123',
        input: {
          prompt: 'Test',
        },
        options: {
          temperature: 0.9,
          maxTokens: 1000,
        },
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<AITaskJobData>;

      await handleAITask(mockJob);

      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.9,
          maxOutputTokens: 1000,
        })
      );
    });
  });
});
