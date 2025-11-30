import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          R2_ACCOUNT_ID: 'test-account',
          R2_ACCESS_KEY_ID: 'test-key',
          R2_SECRET_ACCESS_KEY: 'test-secret',
          R2_BUCKET_NAME: 'test-bucket',
          R2_PUBLIC_URL: 'https://cdn.example.com',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateKey', () => {
    it('should generate a valid S3 key for avatar', () => {
      const key = service.generateKey('org-123', 'avatar', 'profile.jpg');
      expect(key).toMatch(/^org-123\/avatar\/\d+-profile\.jpg$/);
    });

    it('should sanitize filename', () => {
      const key = service.generateKey('org-123', 'logo', 'my logo!@#.png');
      expect(key).toMatch(/^org-123\/logo\/\d+-my_logo___\.png$/);
    });
  });

  describe('getBucket', () => {
    it('should return configured bucket name', () => {
      expect(service.getBucket()).toBe('test-bucket');
    });
  });
});

