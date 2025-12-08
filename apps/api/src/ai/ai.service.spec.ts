/**
 * AI Service Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';
import { AiRepository } from './ai.repository';
import { AiRateLimiterService } from './ai-rate-limiter.service';
import type { TenantContext } from '@forgestack/db';
import type {
  GenerateTextRequestDto,
  GenerateObjectRequestDto,
  ChatRequestDto,
} from './dto';
import { MessageRole, AIProvider } from './dto';

// Mock the AI SDK
jest.mock('ai', () => ({
  generateText: jest.fn(),
  streamText: jest.fn(),
  generateObject: jest.fn(),
}));

jest.mock('@ai-sdk/openai', () => ({
  openai: jest.fn((model: string) => ({ provider: 'openai', model })),
}));

jest.mock('@ai-sdk/anthropic', () => ({
  anthropic: jest.fn((model: string) => ({ provider: 'anthropic', model })),
}));

import { generateText, streamText, generateObject } from 'ai';

describe('AiService', () => {
  let service: AiService;
  let aiRepository: jest.Mocked<AiRepository>;
  let rateLimiter: jest.Mocked<AiRateLimiterService>;

  const mockTenantContext: TenantContext = {
    orgId: 'org-123',
    userId: 'user-123',
    role: 'OWNER' as const,
  };

  beforeEach(async () => {
    const mockRepository = {
      recordUsage: jest.fn(),
      getUsageByOrg: jest.fn(),
      getUsageByProvider: jest.fn(),
      getMonthlyUsage: jest.fn(),
    };

    const mockRateLimiter = {
      checkRateLimit: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: AiRepository,
          useValue: mockRepository,
        },
        {
          provide: AiRateLimiterService,
          useValue: mockRateLimiter,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    aiRepository = module.get(AiRepository);
    rateLimiter = module.get(AiRateLimiterService);

    jest.clearAllMocks();
  });

  describe('generateText', () => {
    const dto: GenerateTextRequestDto = {
      prompt: 'Hello, world!',
      provider: AIProvider.OPENAI,
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 1000,
    };

    it('should successfully generate text and record usage', async () => {
      const mockResult = {
        text: 'Generated response',
        usage: {
          inputTokens: 10,
          outputTokens: 20,
        },
      };

      (generateText as jest.Mock).mockResolvedValueOnce(mockResult);
      aiRepository.recordUsage.mockResolvedValueOnce({} as any);

      const result = await service.generateText(mockTenantContext, 'pro', dto);

      expect(rateLimiter.checkRateLimit).toHaveBeenCalledWith(mockTenantContext, 'pro');
      expect(generateText).toHaveBeenCalledWith({
        model: { provider: 'openai', model: 'gpt-4o-mini' },
        prompt: 'Hello, world!',
        temperature: 0.7,
        maxOutputTokens: 1000,
      });
      expect(aiRepository.recordUsage).toHaveBeenCalledWith({
        orgId: 'org-123',
        userId: 'user-123',
        provider: 'openai',
        model: 'gpt-4o-mini',
        inputTokens: 10,
        outputTokens: 20,
      });
      expect(result).toEqual({
        text: 'Generated response',
        inputTokens: 10,
        outputTokens: 20,
      });
    });

    it('should use default values when optional parameters are not provided', async () => {
      const minimalDto: GenerateTextRequestDto = {
        prompt: 'Test prompt',
      };

      const mockResult = {
        text: 'Response',
        usage: {
          inputTokens: 5,
          outputTokens: 10,
        },
      };

      (generateText as jest.Mock).mockResolvedValueOnce(mockResult);
      aiRepository.recordUsage.mockResolvedValueOnce({} as any);

      await service.generateText(mockTenantContext, 'free', minimalDto);

      expect(generateText).toHaveBeenCalledWith({
        model: { provider: 'openai', model: 'gpt-4o-mini' },
        prompt: 'Test prompt',
        temperature: 0.7,
        maxOutputTokens: 4096,
      });
    });

    it('should throw when rate limited', async () => {
      rateLimiter.checkRateLimit.mockRejectedValueOnce(
        new BadRequestException('Rate limit exceeded')
      );

      await expect(
        service.generateText(mockTenantContext, 'free', dto)
      ).rejects.toThrow(BadRequestException);

      expect(generateText).not.toHaveBeenCalled();
      expect(aiRepository.recordUsage).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException on AI SDK error', async () => {
      (generateText as jest.Mock).mockRejectedValueOnce(new Error('AI SDK error'));

      await expect(
        service.generateText(mockTenantContext, 'pro', dto)
      ).rejects.toThrow(BadRequestException);

      expect(aiRepository.recordUsage).not.toHaveBeenCalled();
    });

    it('should work with anthropic provider', async () => {
      const anthropicDto: GenerateTextRequestDto = {
        prompt: 'Test',
        provider: AIProvider.ANTHROPIC,
        model: 'claude-3-5-sonnet-latest',
      };

      const mockResult = {
        text: 'Anthropic response',
        usage: {
          inputTokens: 15,
          outputTokens: 25,
        },
      };

      (generateText as jest.Mock).mockResolvedValueOnce(mockResult);
      aiRepository.recordUsage.mockResolvedValueOnce({} as any);

      const result = await service.generateText(mockTenantContext, 'pro', anthropicDto);

      expect(generateText).toHaveBeenCalledWith({
        model: { provider: 'anthropic', model: 'claude-3-5-sonnet-latest' },
        prompt: 'Test',
        temperature: 0.7,
        maxOutputTokens: 4096,
      });
      expect(result.text).toBe('Anthropic response');
    });
  });

  describe('streamText', () => {
    const dto: ChatRequestDto = {
      messages: [
        { role: MessageRole.USER, content: 'Hello' },
        { role: MessageRole.ASSISTANT, content: 'Hi there!' },
      ],
      provider: AIProvider.OPENAI,
      model: 'gpt-4o-mini',
      temperature: 0.8,
      maxTokens: 2000,
    };

    it('should successfully stream text', async () => {
      const mockStreamResult = {
        textStream: async function* () {
          yield 'chunk1';
          yield 'chunk2';
        },
      };

      (streamText as jest.Mock).mockReturnValueOnce(mockStreamResult);

      const result = await service.streamText(mockTenantContext, 'pro', dto);

      expect(rateLimiter.checkRateLimit).toHaveBeenCalledWith(mockTenantContext, 'pro');
      expect(streamText).toHaveBeenCalledWith({
        model: { provider: 'openai', model: 'gpt-4o-mini' },
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
        ],
        temperature: 0.8,
        maxOutputTokens: 2000,
      });
      expect(result).toBe(mockStreamResult);
    });

    it('should throw when rate limited', async () => {
      rateLimiter.checkRateLimit.mockRejectedValueOnce(
        new BadRequestException('Rate limit exceeded')
      );

      await expect(
        service.streamText(mockTenantContext, 'free', dto)
      ).rejects.toThrow(BadRequestException);

      expect(streamText).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException on AI SDK error', async () => {
      (streamText as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Stream error');
      });

      await expect(
        service.streamText(mockTenantContext, 'pro', dto)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('generateObject', () => {
    const dto: GenerateObjectRequestDto = {
      prompt: 'Generate a user profile',
      schema: {
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
          active: { type: 'boolean' },
        },
      },
      provider: AIProvider.OPENAI,
      model: 'gpt-4o-mini',
    };

    it('should successfully generate object and record usage', async () => {
      const mockResult = {
        object: {
          name: 'John Doe',
          age: 30,
          active: true,
        },
        usage: {
          inputTokens: 20,
          outputTokens: 15,
        },
      };

      (generateObject as jest.Mock).mockResolvedValueOnce(mockResult);
      aiRepository.recordUsage.mockResolvedValueOnce({} as any);

      const result = await service.generateObject(mockTenantContext, 'pro', dto);

      expect(rateLimiter.checkRateLimit).toHaveBeenCalledWith(mockTenantContext, 'pro');
      expect(generateObject).toHaveBeenCalledWith({
        model: { provider: 'openai', model: 'gpt-4o-mini' },
        schema: expect.any(Object),
        prompt: 'Generate a user profile',
      });
      expect(aiRepository.recordUsage).toHaveBeenCalledWith({
        orgId: 'org-123',
        userId: 'user-123',
        provider: 'openai',
        model: 'gpt-4o-mini',
        inputTokens: 20,
        outputTokens: 15,
      });
      expect(result).toEqual({
        object: {
          name: 'John Doe',
          age: 30,
          active: true,
        },
        inputTokens: 20,
        outputTokens: 15,
      });
    });

    it('should throw BadRequestException for unsupported provider', async () => {
      const invalidDto: GenerateObjectRequestDto = {
        prompt: 'Test',
        schema: { properties: {} },
        provider: 'unsupported' as any,
      };

      await expect(
        service.generateObject(mockTenantContext, 'pro', invalidDto)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when rate limited', async () => {
      rateLimiter.checkRateLimit.mockRejectedValueOnce(
        new BadRequestException('Rate limit exceeded')
      );

      await expect(
        service.generateObject(mockTenantContext, 'free', dto)
      ).rejects.toThrow(BadRequestException);

      expect(generateObject).not.toHaveBeenCalled();
      expect(aiRepository.recordUsage).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException on AI SDK error', async () => {
      (generateObject as jest.Mock).mockRejectedValueOnce(new Error('Generation failed'));

      await expect(
        service.generateObject(mockTenantContext, 'pro', dto)
      ).rejects.toThrow(BadRequestException);

      expect(aiRepository.recordUsage).not.toHaveBeenCalled();
    });
  });
});

