/**
 * OpenTelemetry SDK Initialization for BullMQ Worker
 * 
 * This file MUST be imported FIRST in index.ts before any other imports
 * to enable auto-instrumentation of Redis, PostgreSQL, and other libraries.
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from '@opentelemetry/semantic-conventions';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { SpanExporter } from '@opentelemetry/sdk-trace-base';

/**
 * Get the appropriate trace exporter based on environment configuration
 */
function getTraceExporter(): SpanExporter {
  const exporterType = process.env.OTEL_EXPORTER_TYPE || 'console';

  switch (exporterType) {
    case 'otlp':
      return new OTLPTraceExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
      });

    case 'console':
    default:
      return new ConsoleSpanExporter();
  }
}

/**
 * Initialize OpenTelemetry SDK
 * Only initializes if OTEL_ENABLED is true
 */
function initializeTelemetry() {
  const otelEnabled = process.env.OTEL_ENABLED === 'true';

  if (!otelEnabled) {
    // eslint-disable-next-line no-console
    console.log('[OTEL] OpenTelemetry is disabled (OTEL_ENABLED=false)');
    return null;
  }

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [SEMRESATTRS_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'forgestack-worker',
      [SEMRESATTRS_SERVICE_VERSION]: process.env.npm_package_version || '0.0.1',
      [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
    }),
    traceExporter: getTraceExporter(),
    instrumentations: [
      getNodeAutoInstrumentations({
        // Disable instrumentations we don't need
        '@opentelemetry/instrumentation-fs': { enabled: false },
        '@opentelemetry/instrumentation-dns': { enabled: false },

        // Configure PostgreSQL instrumentation
        '@opentelemetry/instrumentation-pg': {
          enhancedDatabaseReporting: true,
        },

        // Configure Redis (ioredis) instrumentation
        '@opentelemetry/instrumentation-ioredis': {
          enabled: true,
        },
      }),
    ],
  });

  sdk.start();
  // eslint-disable-next-line no-console
  console.log('[OTEL] OpenTelemetry SDK initialized');

  // Graceful shutdown
  const shutdown = () => {
    sdk
      .shutdown()
      // eslint-disable-next-line no-console
      .then(() => console.log('[OTEL] SDK shut down successfully'))
      .catch((err) => console.error('[OTEL] SDK shutdown error:', err))
      .finally(() => process.exit(0));
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return sdk;
}

// Initialize telemetry on module load
export const sdk = initializeTelemetry();

