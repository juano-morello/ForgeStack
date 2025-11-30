import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesRepository } from './activities.repository';

// Mock the database functions
jest.mock('@forgestack/db', () => ({
  ...jest.requireActual('@forgestack/db'),
  withTenantContext: jest.fn(),
  withServiceContext: jest.fn(),
}));

describe('ActivitiesRepository', () => {
  let repository: ActivitiesRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ActivitiesRepository],
    }).compile();

    repository = module.get<ActivitiesRepository>(ActivitiesRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  // Note: Full integration tests for the repository should be done
  // in integration tests with a real database connection
  // These unit tests would require extensive mocking of Drizzle ORM
});

