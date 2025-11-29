import 'dotenv/config';

// Setup test environment
// This file runs before all tests to configure the test environment

// Ensure we're using test database if DATABASE_URL isn't set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/forgestack_dev';
}

