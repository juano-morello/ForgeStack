/**
 * AI Task Handler
 * Processes long-running AI tasks (document processing, batch generation, etc.)
 */

import { Job } from 'bullmq';
import { generateText, generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { createLogger } from '../telemetry/logger';

const logger = createLogger('AITask');

// Default models per provider
const DEFAULT_MODELS = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-sonnet-latest',
};

export interface AITaskJobData {
  taskType: 'generate' | 'summarize' | 'extract';
  orgId: string;
  userId: string;
  input: {
    prompt: string;
    context?: string;
    schema?: Record<string, unknown>; // For extract tasks
  };
  options?: {
    provider?: 'openai' | 'anthropic';
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
  webhookUrl?: string;
}

export interface AITaskResult {
  success: boolean;
  taskType: string;
  output?: string | Record<string, unknown>;
  tokensUsed?: number;
  error?: string;
}

/**
 * AI Task Handler
 * Processes async AI tasks with support for different task types
 */
export async function handleAITask(job: Job<AITaskJobData>): Promise<AITaskResult> {
  const { taskType, orgId, userId, input, options } = job.data;

  logger.info(
    { jobId: job.id, taskType, orgId, userId },
    'Processing AI task job'
  );

  try {
    let result: AITaskResult;

    switch (taskType) {
      case 'generate':
        result = await processGenerate(input, options);
        break;
      case 'summarize':
        result = await processSummarize(input, options);
        break;
      case 'extract':
        result = await processExtract(input, options);
        break;
      default:
        throw new Error(`Unsupported task type: ${taskType}`);
    }

    logger.info(
      { taskType, tokensUsed: result.tokensUsed },
      'AI task completed successfully'
    );

    // TODO: If webhookUrl provided, queue webhook delivery
    // This would integrate with the existing webhook-delivery handler

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ error: errorMessage, taskType }, 'Failed to process AI task');

    return {
      success: false,
      taskType,
      error: errorMessage,
    };
  }
}

/**
 * Process generate task - general text generation
 */
async function processGenerate(
  input: AITaskJobData['input'],
  options?: AITaskJobData['options']
): Promise<AITaskResult> {
  const provider = options?.provider || 'openai';
  const model = getModel(provider, options?.model);

  const prompt = input.context
    ? `${input.context}\n\n${input.prompt}`
    : input.prompt;

  const result = await generateText({
    model,
    prompt,
    temperature: options?.temperature ?? 0.7,
    maxOutputTokens: options?.maxTokens ?? 4096,
  });

  return {
    success: true,
    taskType: 'generate',
    output: result.text,
    tokensUsed: result.usage.totalTokens,
  };
}

/**
 * Process summarize task - text summarization
 */
async function processSummarize(
  input: AITaskJobData['input'],
  options?: AITaskJobData['options']
): Promise<AITaskResult> {
  const provider = options?.provider || 'openai';
  const model = getModel(provider, options?.model);

  const prompt = `Summarize the following text:\n\n${input.context || input.prompt}`;

  const result = await generateText({
    model,
    prompt,
    temperature: options?.temperature ?? 0.3, // Lower temperature for summarization
    maxOutputTokens: options?.maxTokens ?? 2048,
  });

  return {
    success: true,
    taskType: 'summarize',
    output: result.text,
    tokensUsed: result.usage.totalTokens,
  };
}

/**
 * Process extract task - structured data extraction
 */
async function processExtract(
  input: AITaskJobData['input'],
  options?: AITaskJobData['options']
): Promise<AITaskResult> {
  if (!input.schema) {
    throw new Error('Schema is required for extract tasks');
  }

  const provider = options?.provider || 'openai';
  const model = getModel(provider, options?.model);

  // Convert JSON schema to Zod schema
  const zodSchema = jsonSchemaToZod(input.schema);

  const prompt = input.context
    ? `Extract structured data from the following text:\n\n${input.context}\n\nInstructions: ${input.prompt}`
    : input.prompt;

  const result = await generateObject({
    model,
    schema: zodSchema,
    prompt,
  });

  return {
    success: true,
    taskType: 'extract',
    output: result.object as Record<string, unknown>,
    tokensUsed: result.usage.totalTokens,
  };
}

/**
 * Get AI model instance based on provider and model name
 */
function getModel(provider: string, modelName?: string) {
  const model = modelName || DEFAULT_MODELS[provider as keyof typeof DEFAULT_MODELS];

  if (provider === 'openai') {
    return openai(model);
  } else if (provider === 'anthropic') {
    return anthropic(model);
  }

  throw new Error(`Unsupported provider: ${provider}`);
}

/**
 * Convert JSON schema to Zod schema (simplified implementation)
 */
function jsonSchemaToZod(schema: Record<string, unknown>): z.ZodObject<any> {
  const properties = (schema.properties as Record<string, any>) || {};
  const zodShape: Record<string, z.ZodTypeAny> = {};

  for (const [key, prop] of Object.entries(properties)) {
    const type = prop.type as string;

    if (type === 'string') {
      zodShape[key] = z.string();
    } else if (type === 'number') {
      zodShape[key] = z.number();
    } else if (type === 'boolean') {
      zodShape[key] = z.boolean();
    } else if (type === 'array') {
      zodShape[key] = z.array(z.any());
    } else {
      zodShape[key] = z.any();
    }
  }

  return z.object(zodShape);
}

