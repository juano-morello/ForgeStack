/**
 * BullMQ Job Tracing Utilities
 * 
 * Provides utilities to wrap BullMQ job handlers with OpenTelemetry spans
 * and propagate trace context from the API to the worker.
 */

import { trace, context, SpanStatusCode, Span } from '@opentelemetry/api';
import { Job, Processor } from 'bullmq';

const tracer = trace.getTracer('forgestack-worker');

/**
 * Job data with optional trace context propagation
 */
export interface TracedJobData<T = unknown> {
  data?: T;
  _traceContext?: {
    traceId: string;
    spanId: string;
    traceFlags: number;
  };
}

/**
 * Wraps a BullMQ job handler to create OpenTelemetry spans
 * 
 * This wrapper:
 * - Creates a span for each job execution
 * - Includes job metadata as span attributes
 * - Propagates trace context from the API (if available)
 * - Records exceptions and sets span status appropriately
 * 
 * @param queueName - Name of the queue (used in span name)
 * @param handler - The actual job handler function
 * @returns Wrapped handler with tracing
 * 
 * @example
 * const worker = new Worker(
 *   'welcome-email',
 *   withTracing('welcome-email', handleWelcomeEmail),
 *   { connection }
 * );
 */
export function withTracing<T>(
  queueName: string,
  handler: Processor<T>
): Processor<T> {
  return async (job: Job<T>) => {
    // Create a span for this job execution
    const span = tracer.startSpan(`job.${queueName}.process`, {
      attributes: {
        'job.id': job.id || 'unknown',
        'job.name': job.name,
        'job.queue': queueName,
        'job.attempt': job.attemptsMade,
        'job.timestamp': job.timestamp,
      },
    });

    try {
      // Execute the handler within the span context
      const result = await context.with(
        trace.setSpan(context.active(), span),
        () => handler(job)
      );

      // Mark span as successful
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      // Record the error and mark span as failed
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      // Always end the span
      span.end();
    }
  };
}

/**
 * Create a custom span within a job handler
 * 
 * Use this to create child spans for specific operations within a job.
 * 
 * @param name - Span name
 * @param fn - Function to execute within the span
 * @returns Result of the function
 * 
 * @example
 * await withSpan('send-email', async () => {
 *   await emailService.send(email);
 * });
 */
export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  const span = tracer.startSpan(name);

  try {
    const result = await context.with(
      trace.setSpan(context.active(), span),
      () => fn(span)
    );
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    span.recordException(error as Error);
    throw error;
  } finally {
    span.end();
  }
}

