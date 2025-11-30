import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsRepository } from './notifications.repository';

// Mock the @forgestack/db module
jest.mock('@forgestack/db', () => ({
  eq: jest.fn(),
  and: jest.fn(),
  desc: jest.fn(),
  isNull: jest.fn(),
  count: jest.fn(),
  withServiceContext: jest.fn((name, fn) => {
    const mockNotification = {
      id: 'notif-123',
      userId: 'user-123',
      orgId: 'org-123',
      type: 'member.role_changed',
      title: 'Test',
      body: null,
      link: null,
      metadata: null,
      readAt: null,
      emailSent: false,
      createdAt: new Date(),
    };

    return fn({
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([mockNotification]),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      then: jest.fn().mockResolvedValue([{ count: 5 }]),
    });
  }),
  notifications: {},
  notificationPreferences: {},
}));

describe('NotificationsRepository', () => {
  let repository: NotificationsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationsRepository],
    }).compile();

    repository = module.get<NotificationsRepository>(NotificationsRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  // Note: Full repository tests require integration tests with a real database
  // These are basic smoke tests to ensure the repository is properly constructed
  it('should have create method', () => {
    expect(repository.create).toBeDefined();
  });

  it('should have findByUserId method', () => {
    expect(repository.findByUserId).toBeDefined();
  });

  it('should have getUnreadCount method', () => {
    expect(repository.getUnreadCount).toBeDefined();
  });

  it('should have markAsRead method', () => {
    expect(repository.markAsRead).toBeDefined();
  });

  it('should have markAllAsRead method', () => {
    expect(repository.markAllAsRead).toBeDefined();
  });

  it('should have delete method', () => {
    expect(repository.delete).toBeDefined();
  });

  it('should have getPreferences method', () => {
    expect(repository.getPreferences).toBeDefined();
  });

  it('should have upsertPreference method', () => {
    expect(repository.upsertPreference).toBeDefined();
  });
});

