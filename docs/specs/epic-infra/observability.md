# OpenTelemetry Observability Stack

**Epic:** Infrastructure  
**Priority:** High  
**Depends on:** NestJS API skeleton, BullMQ Worker  
**Status:** Draft

---

## Overview

This specification defines the **production-grade observability stack** for ForgeStack using **OpenTelemetry** as the vendor-neutral standard. The goal is to provide complete visibility into system behavior across all components: API, Worker, and Database.

### Current State

ForgeStack currently has:
- Basic console logging via NestJS `Logger`
- A simple `/health` endpoint returning status and timestamp
- `LoggingInterceptor` that logs HTTP requests with method, path, status code, and duration
- No distributed tracing
- No structured JSON logging
- No metrics collection
- No correlation IDs across API → Worker → Database

### Target State

A complete observability stack implementing the **three pillars of observability**:

| Pillar | Purpose | Implementation |
|--------|---------|----------------|
| **Traces** | Distributed request tracking across services | OpenTelemetry SDK with auto-instrumentation |
| **Logs** | Structured event records with context | JSON logging with trace/span ID injection |
| **Metrics** | Quantitative measurements over time | Prometheus-compatible metrics endpoint |

### Why OpenTelemetry?

- **Vendor-neutral**: Export to any backend (Grafana Cloud, Honeycomb, Datadog, Jaeger)
- **Industry standard**: CNCF graduated project with wide adoption
- **Auto-instrumentation**: Automatic tracing for HTTP, database, Redis without code changes
- **Context propagation**: Trace IDs flow automatically across service boundaries
- **Future-proof**: Single instrumentation, multiple export destinations

---

## Acceptance Criteria

### OpenTelemetry SDK Integration
- [ ] OTEL SDK initialized before NestJS application starts
- [ ] Resource attributes configured (service name, version, environment)
- [ ] Context propagation enabled via W3C Trace Context headers
- [ ] SDK gracefully shuts down on application termination

### Auto-Instrumentation
- [ ] HTTP requests/responses automatically traced
- [ ] PostgreSQL queries traced with statement details
- [ ] Redis operations traced
- [ ] BullMQ job processing creates child spans
- [ ] External HTTP calls (fetch/axios) traced

### Tracing
- [ ] All incoming requests create a root span
- [ ] Trace ID available in request context
- [ ] Trace ID injected into all log entries
- [ ] Custom spans can be created for business operations
- [ ] Sampling configuration supports head-based sampling

### Structured Logging
- [ ] All logs output as JSON in production
- [ ] Every log includes: `timestamp`, `level`, `message`, `trace_id`, `span_id`
- [ ] Log levels configurable via environment variable
- [ ] Existing `LoggingInterceptor` enhanced with trace context

### Metrics
- [ ] Request count metric with labels (method, path, status)
- [ ] Request duration histogram
- [ ] Active request gauge
- [ ] Prometheus `/metrics` endpoint available
- [ ] Custom business metrics can be registered

### Exporter Configuration
- [ ] Console exporter for local development
- [ ] OTLP exporter for production backends
- [ ] Jaeger exporter for local tracing UI
- [ ] Exporter selection via `OTEL_EXPORTER_TYPE` environment variable

### Local Observability Stack
- [ ] Docker Compose profile for observability services
- [ ] Grafana for dashboards
- [ ] Tempo for trace storage
- [ ] Loki for log aggregation
- [ ] Prometheus for metrics collection

---

## Technical Design

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ForgeStack                                      │
│                                                                              │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐       │
│  │    NestJS API   │     │      Redis      │     │   BullMQ Worker │       │
│  │                 │────▶│                 │◀────│                 │       │
│  │  OTEL SDK       │     │                 │     │  OTEL SDK       │       │
│  └────────┬────────┘     └─────────────────┘     └────────┬────────┘       │
│           │                                               │                 │
│           │              ┌─────────────────┐              │                 │
│           └─────────────▶│   PostgreSQL    │◀─────────────┘                 │
│                          │  (instrumented) │                                │
│                          └─────────────────┘                                │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
             ┌──────────┐   ┌──────────┐   ┌──────────┐
             │  Traces  │   │   Logs   │   │ Metrics  │
             │  (Tempo) │   │  (Loki)  │   │(Promeths)│
             └────┬─────┘   └────┬─────┘   └────┬─────┘
                  │              │              │
                  └──────────────┼──────────────┘
                                 │
                          ┌──────┴──────┐
                          │   Grafana   │
                          │ (Dashboards)│
                          └─────────────┘
```

### Request Flow with Tracing

```
1. Request arrives at NestJS API
   └─▶ OTEL HTTP instrumentation creates root span
       └─▶ trace_id generated (e.g., "abc123...")

2. TenantContextGuard executes
   └─▶ Child span: "TenantContextGuard.canActivate"
       └─▶ DB query span: "pg.query SELECT FROM organization_members"

3. Controller/Service handles request
   └─▶ Child span: "ProjectsService.findAll"
       └─▶ DB query span: "pg.query SELECT FROM projects"

4. Job enqueued to Redis
   └─▶ Child span: "BullMQ.add welcome-email"
       └─▶ trace_id propagated in job data

5. Worker picks up job (separate process)
   └─▶ Root span created with propagated trace context
       └─▶ Same trace_id links API request to worker processing

6. All logs include trace_id for correlation
   └─▶ {"level":"info","trace_id":"abc123...","message":"..."}
```

---

### OpenTelemetry SDK Setup

The SDK must be initialized **before** any other imports to enable auto-instrumentation.

#### File Structure

```
apps/api/src/
├── telemetry/
│   ├── telemetry.module.ts      # NestJS module for DI
│   ├── otel.ts                  # SDK initialization (imported first)
│   ├── instrumentation.ts       # Instrumentation packages
│   ├── exporters.ts             # Exporter factory
│   └── metrics.service.ts       # Custom metrics service
├── tracing.ts                   # Entry point (imports otel.ts first)
└── main.ts                      # Modified to use tracing.ts

apps/worker/src/
├── telemetry/
│   ├── otel.ts                  # SDK initialization
│   └── instrumentation.ts       # Instrumentation packages
└── worker.ts                    # Modified to init telemetry first
```

#### SDK Initialization Pattern

```typescript
// apps/api/src/telemetry/otel.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
  ATTR_DEPLOYMENT_ENVIRONMENT
} from '@opentelemetry/semantic-conventions';
import { getInstrumentations } from './instrumentation';
import { getTraceExporter } from './exporters';

const sdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'forgestack-api',
    [ATTR_SERVICE_VERSION]: process.env.npm_package_version || '0.0.0',
    [ATTR_DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
  }),
  traceExporter: getTraceExporter(),
  instrumentations: getInstrumentations(),
});

sdk.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('OTEL SDK shut down'))
    .catch((err) => console.error('OTEL SDK shutdown error', err))
    .finally(() => process.exit(0));
});

export { sdk };
```

---

### Auto-Instrumentation Packages

#### Required Packages

| Package | Purpose |
|---------|---------|
| `@opentelemetry/sdk-node` | Node.js SDK with sensible defaults |
| `@opentelemetry/auto-instrumentations-node` | Meta-package for common instrumentations |
| `@opentelemetry/instrumentation-http` | HTTP client/server tracing |
| `@opentelemetry/instrumentation-express` | Express middleware tracing |
| `@opentelemetry/instrumentation-pg` | PostgreSQL query tracing |
| `@opentelemetry/instrumentation-ioredis` | Redis operation tracing |
| `@opentelemetry/instrumentation-nestjs-core` | NestJS-specific spans |

#### Instrumentation Setup

```typescript
// apps/api/src/telemetry/instrumentation.ts
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';

export function getInstrumentations() {
  return [
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
    new NestInstrumentation(),
  ];
}
```

#### Custom BullMQ Instrumentation

BullMQ does not have official OpenTelemetry instrumentation. We need custom context propagation:

```typescript
// apps/worker/src/telemetry/bullmq-instrumentation.ts
import { trace, context, SpanStatusCode } from '@opentelemetry/api';
import { Job } from 'bullmq';

const tracer = trace.getTracer('forgestack-worker');

export interface TracedJobData<T = unknown> {
  data: T;
  _traceContext?: {
    traceId: string;
    spanId: string;
    traceFlags: number;
  };
}

/**
 * Wraps a job handler to create spans and propagate trace context
 */
export function withTracing<T>(
  queueName: string,
  handler: (job: Job<TracedJobData<T>>) => Promise<unknown>
) {
  return async (job: Job<TracedJobData<T>>) => {
    const span = tracer.startSpan(`job.${queueName}.process`, {
      attributes: {
        'job.id': job.id,
        'job.name': job.name,
        'job.queue': queueName,
        'job.attempt': job.attemptsMade,
      },
    });

    try {
      const result = await context.with(
        trace.setSpan(context.active(), span),
        () => handler(job)
      );
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  };
}
```

---

### Tracing Configuration

#### Trace Context Propagation

Trace context is automatically propagated via W3C Trace Context headers (`traceparent`, `tracestate`).

```
Request Headers:
traceparent: 00-abc123def456789012345678901234-fedcba9876543210-01
             │  │                          │                  │
             │  │                          │                  └─ Trace flags
             │  │                          └─ Parent span ID
             │  └─ Trace ID (32 hex chars)
             └─ Version
```

#### Sampling Configuration

| Environment | Strategy | Rate |
|-------------|----------|------|
| Development | AlwaysOn | 100% |
| Staging | TraceIdRatio | 10% |
| Production | TraceIdRatio | 1% |

```typescript
// apps/api/src/telemetry/sampling.ts
import {
  ParentBasedSampler,
  TraceIdRatioBasedSampler,
  AlwaysOnSampler
} from '@opentelemetry/sdk-trace-base';

export function getSampler() {
  const env = process.env.NODE_ENV;
  const sampleRate = parseFloat(process.env.OTEL_TRACES_SAMPLER_ARG || '1.0');

  if (env === 'production') {
    return new ParentBasedSampler({
      root: new TraceIdRatioBasedSampler(sampleRate),
    });
  }

  return new AlwaysOnSampler();
}
```

#### Accessing Trace Context in Code

```typescript
// apps/api/src/telemetry/trace-context.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { trace } from '@opentelemetry/api';

export const TraceContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const span = trace.getActiveSpan();
    if (!span) return null;

    const spanContext = span.spanContext();
    return {
      traceId: spanContext.traceId,
      spanId: spanContext.spanId,
    };
  },
);

// Usage in controller
@Get()
async findAll(@TraceContext() trace: { traceId: string; spanId: string }) {
  this.logger.debug(`Processing request`, { traceId: trace?.traceId });
  // ...
}
```

---

### Structured Logging

#### Replace Console Logging with Structured JSON

We'll use **Pino** for high-performance structured logging with automatic trace context injection.

```typescript
// apps/api/src/telemetry/logger.ts
import pino from 'pino';
import { trace } from '@opentelemetry/api';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',

  // JSON in production, pretty in development
  transport: isProduction ? undefined : {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
    },
  },

  // Inject trace context into every log
  mixin() {
    const span = trace.getActiveSpan();
    if (!span) return {};

    const spanContext = span.spanContext();
    return {
      trace_id: spanContext.traceId,
      span_id: spanContext.spanId,
    };
  },

  // Standard log fields
  base: {
    service: process.env.OTEL_SERVICE_NAME || 'forgestack-api',
    env: process.env.NODE_ENV || 'development',
  },
});

// Create child logger for modules
export function createLogger(name: string) {
  return logger.child({ module: name });
}
```

#### Log Output Format

**Development (pretty-printed):**
```
[2024-01-15 10:30:45] INFO (forgestack-api): Request received
    module: "HTTP"
    trace_id: "abc123..."
    method: "GET"
    path: "/api/v1/projects"
```

**Production (JSON):**
```json
{
  "level": 30,
  "time": 1705312245000,
  "service": "forgestack-api",
  "env": "production",
  "module": "HTTP",
  "trace_id": "abc123def456789012345678901234",
  "span_id": "fedcba9876543210",
  "method": "GET",
  "path": "/api/v1/projects",
  "msg": "Request received"
}
```

#### Enhanced LoggingInterceptor

```typescript
// apps/api/src/core/interceptors/logging.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { trace } from '@opentelemetry/api';
import { createLogger } from '../../telemetry/logger';

const logger = createLogger('HTTP');

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url, headers } = request;
    const startTime = Date.now();

    // Get trace context
    const span = trace.getActiveSpan();
    const traceId = span?.spanContext().traceId;

    logger.info({
      method,
      path: url,
      userAgent: headers['user-agent'],
      traceId,
    }, 'Request received');

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const duration = Date.now() - startTime;

          logger.info({
            method,
            path: url,
            statusCode: response.statusCode,
            duration,
            traceId,
          }, 'Request completed');
        },
        error: (error) => {
          const duration = Date.now() - startTime;

          logger.error({
            method,
            path: url,
            statusCode: error.status || 500,
            duration,
            traceId,
            error: error.message,
          }, 'Request failed');
        },
      }),
    );
  }
}
```

---

### Metrics

#### Default Metrics

The SDK automatically collects runtime metrics. We'll add HTTP request metrics and custom business metrics.

```typescript
// apps/api/src/telemetry/metrics.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { metrics, Counter, Histogram, UpDownCounter } from '@opentelemetry/api';

@Injectable()
export class MetricsService implements OnModuleInit {
  private meter = metrics.getMeter('forgestack-api');

  // Request metrics
  private requestCounter!: Counter;
  private requestDuration!: Histogram;
  private activeRequests!: UpDownCounter;

  // Business metrics
  private jobsEnqueued!: Counter;
  private activeOrganizations!: UpDownCounter;

  onModuleInit() {
    // HTTP request count
    this.requestCounter = this.meter.createCounter('http_requests_total', {
      description: 'Total number of HTTP requests',
    });

    // HTTP request duration histogram
    this.requestDuration = this.meter.createHistogram('http_request_duration_ms', {
      description: 'HTTP request duration in milliseconds',
      unit: 'ms',
    });

    // Active requests gauge
    this.activeRequests = this.meter.createUpDownCounter('http_active_requests', {
      description: 'Number of active HTTP requests',
    });

    // Jobs enqueued counter
    this.jobsEnqueued = this.meter.createCounter('jobs_enqueued_total', {
      description: 'Total number of jobs enqueued',
    });

    // Active organizations (for capacity planning)
    this.activeOrganizations = this.meter.createUpDownCounter('active_organizations', {
      description: 'Number of active organizations',
    });
  }

  recordRequest(method: string, path: string, statusCode: number, duration: number) {
    const labels = { method, path: this.normalizePath(path), status_code: String(statusCode) };
    this.requestCounter.add(1, labels);
    this.requestDuration.record(duration, labels);
  }

  incrementActiveRequests() {
    this.activeRequests.add(1);
  }

  decrementActiveRequests() {
    this.activeRequests.add(-1);
  }

  recordJobEnqueued(queueName: string) {
    this.jobsEnqueued.add(1, { queue: queueName });
  }

  private normalizePath(path: string): string {
    // Replace UUIDs and IDs with placeholders for cardinality control
    return path
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
      .replace(/\/\d+/g, '/:id');
  }
}
```

#### Prometheus Metrics Endpoint

```typescript
// apps/api/src/telemetry/metrics.controller.ts
import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { Public } from '../core/decorators/public.decorator';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly prometheusExporter: PrometheusExporter) {}

  @Get()
  @Public()
  async getMetrics(@Res() res: Response) {
    res.set('Content-Type', 'text/plain');
    const metrics = await this.prometheusExporter.collect();
    res.send(metrics);
  }
}
```

---

### Exporters Configuration

#### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OTEL_EXPORTER_TYPE` | Exporter type: `console`, `otlp`, `jaeger` | `console` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OTLP collector endpoint | `http://localhost:4318` |
| `OTEL_EXPORTER_OTLP_HEADERS` | OTLP headers (for auth) | - |
| `OTEL_SERVICE_NAME` | Service name for tracing | `forgestack-api` |
| `OTEL_TRACES_SAMPLER_ARG` | Sampling rate (0.0-1.0) | `1.0` |
| `LOG_LEVEL` | Log level: `debug`, `info`, `warn`, `error` | `info` |

#### Exporter Factory

```typescript
// apps/api/src/telemetry/exporters.ts
import { SpanExporter } from '@opentelemetry/sdk-trace-base';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

export type ExporterType = 'console' | 'otlp' | 'jaeger';

export function getTraceExporter(): SpanExporter {
  const exporterType = (process.env.OTEL_EXPORTER_TYPE || 'console') as ExporterType;

  switch (exporterType) {
    case 'console':
      return new ConsoleSpanExporter();

    case 'otlp':
      return new OTLPTraceExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
        headers: parseHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS),
      });

    case 'jaeger':
      return new JaegerExporter({
        endpoint: process.env.OTEL_EXPORTER_JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
      });

    default:
      console.warn(`Unknown exporter type: ${exporterType}, using console`);
      return new ConsoleSpanExporter();
  }
}

function parseHeaders(headersStr?: string): Record<string, string> {
  if (!headersStr) return {};

  return headersStr.split(',').reduce((acc, pair) => {
    const [key, value] = pair.split('=');
    if (key && value) acc[key.trim()] = value.trim();
    return acc;
  }, {} as Record<string, string>);
}
```

#### Backend-Specific Configuration

**Grafana Cloud:**
```env
OTEL_EXPORTER_TYPE=otlp
OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp-gateway-prod-us-central-0.grafana.net/otlp
OTEL_EXPORTER_OTLP_HEADERS=Authorization=Basic <base64-encoded-api-key>
```

**Honeycomb:**
```env
OTEL_EXPORTER_TYPE=otlp
OTEL_EXPORTER_OTLP_ENDPOINT=https://api.honeycomb.io
OTEL_EXPORTER_OTLP_HEADERS=x-honeycomb-team=<your-api-key>
```

**Local Jaeger:**
```env
OTEL_EXPORTER_TYPE=jaeger
OTEL_EXPORTER_JAEGER_ENDPOINT=http://localhost:14268/api/traces
```

---

### Local Observability Stack

#### Docker Compose Profile

Add an `observability` profile to `docker-compose.yml`:

```yaml
# docker-compose.yml (additions)
services:
  # ... existing postgres and redis services ...

  # Grafana - Dashboards
  grafana:
    image: grafana/grafana:10-alpine
    container_name: forgestack-grafana
    profiles: ["observability"]
    restart: unless-stopped
    ports:
      - "3001:3000"
    environment:
      - GF_AUTH_ANONYMOUS_ENABLED=true
      - GF_AUTH_ANONYMOUS_ORG_ROLE=Admin
      - GF_AUTH_DISABLE_LOGIN_FORM=true
    volumes:
      - grafana_data:/var/lib/grafana
      - ./infra/grafana/provisioning:/etc/grafana/provisioning
      - ./infra/grafana/dashboards:/var/lib/grafana/dashboards

  # Tempo - Distributed Tracing
  tempo:
    image: grafana/tempo:2-alpine
    container_name: forgestack-tempo
    profiles: ["observability"]
    restart: unless-stopped
    command: ["-config.file=/etc/tempo.yaml"]
    ports:
      - "3200:3200"   # Tempo API
      - "4317:4317"   # OTLP gRPC
      - "4318:4318"   # OTLP HTTP
    volumes:
      - ./infra/tempo/tempo.yaml:/etc/tempo.yaml
      - tempo_data:/tmp/tempo

  # Loki - Log Aggregation
  loki:
    image: grafana/loki:2-alpine
    container_name: forgestack-loki
    profiles: ["observability"]
    restart: unless-stopped
    ports:
      - "3100:3100"
    command: -config.file=/etc/loki/local-config.yaml
    volumes:
      - loki_data:/loki

  # Prometheus - Metrics
  prometheus:
    image: prom/prometheus:v2-alpine
    container_name: forgestack-prometheus
    profiles: ["observability"]
    restart: unless-stopped
    ports:
      - "9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    volumes:
      - ./infra/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

  # Promtail - Log shipping to Loki
  promtail:
    image: grafana/promtail:2-alpine
    container_name: forgestack-promtail
    profiles: ["observability"]
    restart: unless-stopped
    volumes:
      - ./infra/promtail/promtail.yaml:/etc/promtail/config.yml
      - /var/log:/var/log
    command: -config.file=/etc/promtail/config.yml

volumes:
  # ... existing volumes ...
  grafana_data:
  tempo_data:
  loki_data:
  prometheus_data:
```

#### Configuration Files

**Tempo Configuration (`infra/tempo/tempo.yaml`):**
```yaml
server:
  http_listen_port: 3200

distributor:
  receivers:
    otlp:
      protocols:
        grpc:
        http:

storage:
  trace:
    backend: local
    local:
      path: /tmp/tempo/blocks
    wal:
      path: /tmp/tempo/wal

metrics_generator:
  registry:
    external_labels:
      source: tempo
  storage:
    path: /tmp/tempo/generator/wal
```

**Prometheus Configuration (`infra/prometheus/prometheus.yml`):**
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'forgestack-api'
    static_configs:
      - targets: ['host.docker.internal:4000']
    metrics_path: '/api/v1/metrics'

  - job_name: 'tempo'
    static_configs:
      - targets: ['tempo:3200']
```

#### Starting the Observability Stack

```bash
# Start all services including observability
docker compose --profile observability up -d

# Or start only core services
docker compose up -d

# Access dashboards
# Grafana: http://localhost:3001
# Jaeger (if using): http://localhost:16686
# Prometheus: http://localhost:9090
```

---

## API Implementation

### Telemetry Module

```typescript
// apps/api/src/telemetry/telemetry.module.ts
import { Module, Global } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';

@Global()
@Module({
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class TelemetryModule {}
```

### Entry Point Modification

The SDK must be initialized before any other imports:

```typescript
// apps/api/src/tracing.ts
// This file must be imported FIRST in main.ts
import './telemetry/otel';

export {};
```

```typescript
// apps/api/src/main.ts (modified)
import './tracing'; // MUST be first import

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
// ... rest of imports
```

### Integration with Existing Components

The existing `LoggingInterceptor` will be enhanced (see Structured Logging section above).

Add `TelemetryModule` to `app.module.ts`:

```typescript
// apps/api/src/app.module.ts (additions)
import { TelemetryModule } from './telemetry/telemetry.module';

@Module({
  imports: [
    TelemetryModule, // Add early in imports
    // ... existing imports
  ],
})
export class AppModule {}
```

---

## Worker Implementation

### Worker Telemetry Setup

```typescript
// apps/worker/src/telemetry/otel.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { getTraceExporter } from './exporters';

const sdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'forgestack-worker',
    [ATTR_SERVICE_VERSION]: process.env.npm_package_version || '0.0.0',
  }),
  traceExporter: getTraceExporter(),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
  ],
});

sdk.start();

process.on('SIGTERM', () => {
  sdk.shutdown().finally(() => process.exit(0));
});

export { sdk };
```

### Worker Entry Point

```typescript
// apps/worker/src/worker.ts (modified)
import './telemetry/otel'; // MUST be first import

import { Worker, Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { config } from './config';
import { withTracing } from './telemetry/bullmq-instrumentation';
import { welcomeEmailHandler } from './handlers/welcome-email.handler';
import { createLogger } from './telemetry/logger';

const logger = createLogger('Worker');

const connection = new Redis(config.redisUrl, { maxRetriesPerRequest: null });

// Wrap handlers with tracing
const welcomeEmailWorker = new Worker(
  'welcome-email',
  withTracing('welcome-email', welcomeEmailHandler),
  { connection, concurrency: config.concurrency }
);

welcomeEmailWorker.on('completed', (job) => {
  logger.info({ jobId: job.id, queue: 'welcome-email' }, 'Job completed');
});

welcomeEmailWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, queue: 'welcome-email', error: err.message }, 'Job failed');
});

logger.info('Worker started, waiting for jobs...');
```

### Trace Context Propagation in Jobs

When enqueueing jobs, include trace context:

```typescript
// apps/api/src/queue/queue.service.ts (enhanced)
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { trace } from '@opentelemetry/api';

@Injectable()
export class QueueService {
  private welcomeEmailQueue: Queue;

  async addWelcomeEmailJob(userId: string, email: string) {
    // Capture current trace context
    const span = trace.getActiveSpan();
    const spanContext = span?.spanContext();

    const job = await this.welcomeEmailQueue.add('send', {
      data: { userId, email },
      _traceContext: spanContext ? {
        traceId: spanContext.traceId,
        spanId: spanContext.spanId,
        traceFlags: spanContext.traceFlags,
      } : undefined,
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });

    return job.id;
  }
}
```

---

## Implementation Tasks

### 1. Core OTEL SDK Setup
- [ ] 1.1 Install OpenTelemetry packages in `/apps/api`
- [ ] 1.2 Create `src/telemetry/otel.ts` with SDK initialization
- [ ] 1.3 Create `src/telemetry/instrumentation.ts` with instrumentation config
- [ ] 1.4 Create `src/telemetry/exporters.ts` with exporter factory
- [ ] 1.5 Create `src/tracing.ts` entry point wrapper
- [ ] 1.6 Modify `src/main.ts` to import tracing first

### 2. Structured Logging
- [ ] 2.1 Install Pino and pino-pretty packages
- [ ] 2.2 Create `src/telemetry/logger.ts` with trace-aware logger
- [ ] 2.3 Update `LoggingInterceptor` to use Pino with trace context
- [ ] 2.4 Update `HttpExceptionFilter` to use structured logging
- [ ] 2.5 Create `createLogger()` factory for module-specific loggers

### 3. Metrics Implementation
- [ ] 3.1 Create `src/telemetry/metrics.service.ts`
- [ ] 3.2 Create `src/telemetry/metrics.controller.ts` with `/metrics` endpoint
- [ ] 3.3 Create `src/telemetry/telemetry.module.ts`
- [ ] 3.4 Register TelemetryModule in AppModule
- [ ] 3.5 Integrate MetricsService with LoggingInterceptor

### 4. Worker Instrumentation
- [ ] 4.1 Install OpenTelemetry packages in `/apps/worker`
- [ ] 4.2 Create `src/telemetry/otel.ts` for worker
- [ ] 4.3 Create `src/telemetry/bullmq-instrumentation.ts` with `withTracing()`
- [ ] 4.4 Create `src/telemetry/logger.ts` for worker
- [ ] 4.5 Update `src/worker.ts` to initialize telemetry first
- [ ] 4.6 Wrap all job handlers with tracing

### 5. Trace Context Propagation
- [ ] 5.1 Create `src/telemetry/trace-context.decorator.ts` for controllers
- [ ] 5.2 Update QueueService to propagate trace context in job data
- [ ] 5.3 Update worker handlers to restore trace context
- [ ] 5.4 Verify traces span API → Worker correctly

### 6. Local Observability Stack
- [ ] 6.1 Create `infra/tempo/tempo.yaml` configuration
- [ ] 6.2 Create `infra/prometheus/prometheus.yml` configuration
- [ ] 6.3 Create `infra/promtail/promtail.yaml` configuration
- [ ] 6.4 Create `infra/grafana/provisioning/` with datasources
- [ ] 6.5 Create sample Grafana dashboards in `infra/grafana/dashboards/`
- [ ] 6.6 Update `docker-compose.yml` with observability profile

### 7. Environment Configuration
- [ ] 7.1 Add OTEL environment variables to `.env.example`
- [ ] 7.2 Update `apps/api/src/config/configuration.ts` with OTEL config
- [ ] 7.3 Update `apps/worker/src/config.ts` with OTEL config
- [ ] 7.4 Document environment variables in README

### 8. Documentation
- [ ] 8.1 Update root README with observability setup instructions
- [ ] 8.2 Create `docs/observability.md` with usage guide
- [ ] 8.3 Document how to view traces in Grafana/Jaeger
- [ ] 8.4 Document how to add custom spans and metrics

---

## Test Plan

### Unit Tests

| Test Case | Expected Result |
|-----------|-----------------|
| SDK initializes without errors | No exceptions on startup |
| Logger includes trace_id when span is active | Log output contains trace_id field |
| Logger omits trace_id when no span | Log output works without trace context |
| MetricsService records request metrics | Counter and histogram values increase |
| Path normalization replaces UUIDs | `/projects/abc-123-uuid` → `/projects/:id` |
| Exporter factory returns correct exporter | Console, OTLP, or Jaeger based on env |

### Integration Tests

| Test Case | Expected Result |
|-----------|-----------------|
| HTTP request creates trace | Span visible in exporter output |
| Database query creates child span | pg.query span nested under request span |
| `GET /api/v1/metrics` returns Prometheus format | Valid Prometheus metrics text |
| Health endpoint does not create trace | No span for `/api/v1/health` |
| Error response includes trace_id in logs | Correlation possible via logs |

### E2E Test Scenarios

| Scenario | Steps | Expected |
|----------|-------|----------|
| Trace API request | 1. Make authenticated request 2. Check Tempo/Jaeger | Full trace with all spans visible |
| Trace API → Worker flow | 1. Trigger job via API 2. Wait for processing 3. Check traces | Single trace spans both services |
| Verify log correlation | 1. Make request 2. Check logs 3. Search by trace_id | All related logs found |
| Metrics scrape | 1. Make several requests 2. Check Prometheus | Request count and duration recorded |
| Dashboard display | 1. Start observability stack 2. Open Grafana | Dashboards show real data |

### Performance Tests

| Test Case | Threshold |
|-----------|-----------|
| SDK initialization time | < 500ms |
| Per-request overhead | < 5ms |
| Memory overhead | < 50MB additional |
| Metrics endpoint response time | < 100ms |

---

## Dependencies

### API (`/apps/api`)

| Package | Version | Purpose |
|---------|---------|---------|
| `@opentelemetry/sdk-node` | `^0.52.x` | Node.js SDK |
| `@opentelemetry/auto-instrumentations-node` | `^0.48.x` | Auto-instrumentation bundle |
| `@opentelemetry/instrumentation-nestjs-core` | `^0.39.x` | NestJS-specific instrumentation |
| `@opentelemetry/exporter-trace-otlp-http` | `^0.52.x` | OTLP HTTP exporter |
| `@opentelemetry/exporter-jaeger` | `^1.25.x` | Jaeger exporter |
| `@opentelemetry/exporter-prometheus` | `^0.52.x` | Prometheus metrics exporter |
| `pino` | `^9.x` | Structured logging |
| `pino-pretty` | `^11.x` | Dev log formatting |

### Worker (`/apps/worker`)

| Package | Version | Purpose |
|---------|---------|---------|
| `@opentelemetry/sdk-node` | `^0.52.x` | Node.js SDK |
| `@opentelemetry/auto-instrumentations-node` | `^0.48.x` | Auto-instrumentation bundle |
| `@opentelemetry/exporter-trace-otlp-http` | `^0.52.x` | OTLP HTTP exporter |
| `pino` | `^9.x` | Structured logging |
| `pino-pretty` | `^11.x` | Dev log formatting |

---

## Security Considerations

1. **Sensitive data in spans** – Never include passwords, tokens, or PII in span attributes
2. **Sampling in production** – Use sampling to reduce data volume and costs
3. **OTLP authentication** – Use secure headers for production OTLP endpoints
4. **Metrics endpoint protection** – Consider adding auth to `/metrics` in production
5. **Log redaction** – Redact sensitive fields before logging
6. **Local stack security** – Observability stack is development-only; don't expose in production

---

## Future Enhancements (Out of Scope)

- Custom span attributes for business context
- Exemplars linking metrics to traces
- Log-based alerting via Loki
- SLO dashboards in Grafana
- Error tracking integration (Sentry)
- Real User Monitoring (RUM) for frontend
- Database slow query dashboards
- Cost optimization dashboards

---

*Spec created following SDD methodology as defined in agents.md*
```
```

