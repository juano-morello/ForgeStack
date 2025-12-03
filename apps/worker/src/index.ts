/**
 * Worker Entry Point
 *
 * IMPORTANT: The telemetry/otel import MUST be first to enable auto-instrumentation
 * of Redis, PostgreSQL, and other libraries before they are loaded.
 */
import './telemetry/otel';
import './worker';

