/**
 * Health Check Endpoint for Next.js Web App
 * Used by Docker health checks and load balancers
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'forgestack-web',
  });
}

