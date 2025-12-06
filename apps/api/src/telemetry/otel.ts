/**
 * OpenTelemetry SDK initialization
 * MUST be imported FIRST before any other application code
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from '@opentelemetry/semantic-conventions';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';

// Check if OTEL is enabled
const otelEnabled = process.env.OTEL_ENABLED === 'true';

if (!otelEnabled) {
  // eslint-disable-next-line no-console
  console.log('OpenTelemetry is disabled. Set OTEL_ENABLED=true to enable.');
}

// Exporter factory
function getTraceExporter() {
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

// Initialize SDK only if enabled
let sdk: NodeSDK | null = null;

if (otelEnabled) {
  sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [SEMRESATTRS_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'forgestack-api',
      [SEMRESATTRS_SERVICE_VERSION]: process.env.npm_package_version || '0.0.1',
      [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
    }),
    traceExporter: getTraceExporter(),
    instrumentations: [
      getNodeAutoInstrumentations({
        // Disable instrumentations we don't need
        '@opentelemetry/instrumentation-fs': { enabled: false },
        '@opentelemetry/instrumentation-dns': { enabled: false },

        // Configure HTTP instrumentation
        '@opentelemetry/instrumentation-http': {
          ignoreIncomingRequestHook: (request) => {
            // Ignore health checks to reduce noise
            return request.url === '/api/v1/health';
          },
        },

        // Configure PostgreSQL instrumentation
        '@opentelemetry/instrumentation-pg': {
          enhancedDatabaseReporting: true,
        },
      }),
    ],
  });

  sdk.start();
  // eslint-disable-next-line no-console
  console.log('OpenTelemetry SDK initialized');

  // Graceful shutdown
  process.on('SIGTERM', () => {
    sdk
      ?.shutdown()
      // eslint-disable-next-line no-console
      .then(() => console.log('OTEL SDK shut down'))
      .catch((err) => console.error('OTEL SDK shutdown error', err))
      .finally(() => process.exit(0));
  });
}

export { sdk };

