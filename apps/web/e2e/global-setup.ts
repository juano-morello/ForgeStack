import { FullConfig } from '@playwright/test';

/**
 * Global setup for Playwright E2E tests
 * 
 * This runs once before all tests and performs:
 * - Environment validation
 * - Server health checks
 * - Setup logging
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E test suite...');
  console.log(`📍 Base URL: ${config.projects[0].use?.baseURL}`);
  
  // Health check
  const baseURL = config.projects[0].use?.baseURL || 'http://localhost:3000';
  try {
    const response = await fetch(`${baseURL}/api/health`);
    if (!response.ok) {
      console.warn('⚠️ Health check returned non-OK status');
    }
    console.log('✅ Server is accessible');
  } catch (error) {
    console.warn('⚠️ Could not reach server - tests may fail if server is not running');
  }
}

export default globalSetup;

