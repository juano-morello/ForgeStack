# File Uploads Integration (Cloudflare R2)

**Epic:** File Uploads  
**Priority:** TBD  
**Depends on:** Drizzle Schema, RLS Policies, NestJS API Skeleton  
**Status:** Draft

---

## 1. Context

### Why File Uploads Are Needed

ForgeStack requires a robust file upload system to support:
- **User avatars** – Profile pictures for user identity
- **Organization logos** – Branding for multi-tenant organizations
- **Document attachments** – Files attached to projects, comments, and other entities

### Business Value

| Use Case | Value |
|----------|-------|
| User avatars | Personalization, identity recognition in UI |
| Organization logos | Brand identity for tenants |
| Document attachments | Collaboration, file sharing within orgs |
| Storage quotas | Revenue opportunity (tiered storage plans) |

### Technical Approach

**Cloudflare R2** is the primary storage backend due to:
- **S3-compatible API** – Standard interface, easy migration path
- **Zero egress fees** – Cost-effective for read-heavy workloads
- **Global edge network** – Fast access worldwide via Cloudflare CDN
- **Presigned URL support** – Secure, time-limited access without exposing credentials

Architecture:
```
┌─────────────┐     1. Request presigned URL    ┌─────────────┐
│   Frontend  │ ─────────────────────────────► │   NestJS    │
│   (Next.js) │                                │     API     │
└─────────────┘                                └─────────────┘
       │                                              │
       │ 2. Upload directly to R2                     │ Generate presigned URL
       ▼                                              ▼
┌─────────────┐                                ┌─────────────┐
│ Cloudflare  │                                │  PostgreSQL │
│     R2      │                                │  (files)    │
└─────────────┘                                └─────────────┘
       │
       │ 3. Download via presigned URL
       ▼
┌─────────────┐
│   User      │
└─────────────┘
```

### Security Considerations

- **Never expose bucket credentials to frontend** – All access through presigned URLs
- **Time-limited presigned URLs** – Upload: 15 minutes, Download: 1 hour
- **RLS enforcement** – All file records scoped to org_id
- **File validation** – Server-side verification of type and size
- **Content-Type restrictions** – Prevent executable uploads
- **Storage quotas** – Prevent abuse and enable monetization

---

## 2. User Stories

### US-1: User Avatar Upload
**As a user**, I want to upload my profile avatar so that my profile is personalized and I'm recognizable in the application.

### US-2: Organization Logo Upload
**As an organization owner**, I want to upload an organization logo so that our brand is visible throughout the workspace.

### US-3: File Attachments
**As an organization member**, I want to upload file attachments to projects so that I can share documents with my team.

### US-4: Storage Quota Management
**As an organization admin**, I want to view and manage our storage usage so that I can ensure we stay within our plan limits.

### US-5: Orphaned File Cleanup
**As the system**, I want to automatically clean up orphaned files so that storage isn't wasted on incomplete uploads.

---

## 3. Acceptance Criteria

### US-1: User Avatar Upload

| ID | Criteria |
|----|----------|
| AC-1.1 | User can upload image files up to 5MB for avatar |
| AC-1.2 | Supported formats: JPEG, PNG, GIF, WebP |
| AC-1.3 | File is stored in R2 under `avatars/{user_id}/{filename}` |
| AC-1.4 | Previous avatar is soft-deleted when new one is uploaded |
| AC-1.5 | Avatar is accessible via presigned URL |
| AC-1.6 | Invalid file types are rejected with clear error message |
| AC-1.7 | Files exceeding size limit are rejected before upload |

### US-2: Organization Logo Upload

| ID | Criteria |
|----|----------|
| AC-2.1 | Only OWNER role can upload organization logo |
| AC-2.2 | Supported formats: JPEG, PNG, GIF, WebP, SVG |
| AC-2.3 | Maximum file size: 5MB |
| AC-2.4 | File is stored under `logos/{org_id}/{filename}` |
| AC-2.5 | Previous logo is soft-deleted when new one is uploaded |
| AC-2.6 | Logo counts toward organization storage quota |

### US-3: File Attachments

| ID | Criteria |
|----|----------|
| AC-3.1 | Members can upload attachments up to 50MB |
| AC-3.2 | Attachments are linked to entity (project, comment, etc.) |
| AC-3.3 | Files are stored under `attachments/{org_id}/{entity_type}/{entity_id}/{filename}` |
| AC-3.4 | All files are accessible only to org members via RLS |
| AC-3.5 | File metadata includes original filename, size, and content type |
| AC-3.6 | Attachment counts toward organization storage quota |

### US-4: Storage Quota Management

| ID | Criteria |
|----|----------|
| AC-4.1 | Organization has a configured storage quota (default: 1GB free tier) |
| AC-4.2 | Current storage usage is tracked in `organizations.storage_used` |
| AC-4.3 | Upload is rejected if it would exceed quota |
| AC-4.4 | Admins can view current storage usage and quota |
| AC-4.5 | Storage reclaimed when files are permanently deleted |

### US-5: Orphaned File Cleanup

| ID | Criteria |
|----|----------|
| AC-5.1 | Incomplete uploads (no `completed_at`) are deleted after 24 hours |
| AC-5.2 | Soft-deleted files are permanently removed after 30 days |
| AC-5.3 | Worker job runs on schedule (configurable, default: hourly) |
| AC-5.4 | Storage usage is updated when files are permanently deleted |
| AC-5.5 | Deletion is logged for audit purposes |

---

## 4. Database Schema

### files Table

```sql
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,

  -- Storage location
  bucket TEXT NOT NULL,
  key TEXT NOT NULL UNIQUE,

  -- File metadata
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size BIGINT NOT NULL,

  -- Purpose and linking
  purpose TEXT NOT NULL, -- 'avatar', 'logo', 'attachment'
  entity_type TEXT,      -- 'project', 'comment', etc. (nullable)
  entity_id UUID,        -- Linked entity ID (nullable)

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ, -- NULL until upload confirmed
  deleted_at TIMESTAMPTZ,   -- Soft delete

  -- Constraints
  CONSTRAINT valid_purpose CHECK (purpose IN ('avatar', 'logo', 'attachment')),
  CONSTRAINT attachment_requires_entity CHECK (
    purpose != 'attachment' OR (entity_type IS NOT NULL AND entity_id IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_files_org_id ON files(org_id);
CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_purpose ON files(purpose);
CREATE INDEX idx_files_entity ON files(entity_type, entity_id) WHERE entity_type IS NOT NULL;
CREATE INDEX idx_files_orphaned ON files(created_at) WHERE completed_at IS NULL;
CREATE INDEX idx_files_deleted ON files(deleted_at) WHERE deleted_at IS NOT NULL;
```

### RLS Policies for files Table

```sql
-- Enable RLS
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE files FORCE ROW LEVEL SECURITY;

-- SELECT: Org members can view their org's files
CREATE POLICY files_select_policy ON files
  FOR SELECT
  USING (
    org_id::text = current_setting('app.current_org_id', true)
  );

-- INSERT: Any org member can upload files to their org
CREATE POLICY files_insert_policy ON files
  FOR INSERT
  WITH CHECK (
    org_id::text = current_setting('app.current_org_id', true)
    AND user_id::text = current_setting('app.current_user_id', true)
  );

-- UPDATE: Only file owner or OWNER role can update
CREATE POLICY files_update_policy ON files
  FOR UPDATE
  USING (
    org_id::text = current_setting('app.current_org_id', true)
    AND (
      user_id::text = current_setting('app.current_user_id', true)
      OR current_setting('app.current_role', true) = 'OWNER'
    )
  );

-- DELETE: Only file owner or OWNER role can soft-delete
CREATE POLICY files_delete_policy ON files
  FOR DELETE
  USING (
    org_id::text = current_setting('app.current_org_id', true)
    AND (
      user_id::text = current_setting('app.current_user_id', true)
      OR current_setting('app.current_role', true) = 'OWNER'
    )
  );
```

### Organizations Table Update

```sql
-- Add storage tracking columns to organizations table
ALTER TABLE organizations
  ADD COLUMN storage_used BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN storage_quota BIGINT NOT NULL DEFAULT 1073741824; -- 1GB default
```

---

## 5. API Endpoints

### POST /api/v1/files/presigned-url

Request a presigned URL for uploading a file.

**Request:**
```typescript
interface CreatePresignedUrlDto {
  filename: string;      // Original filename
  contentType: string;   // MIME type
  size: number;          // File size in bytes
  purpose: 'avatar' | 'logo' | 'attachment';
  entityType?: string;   // Required for attachments
  entityId?: string;     // Required for attachments
}
```

**Response:**
```typescript
interface PresignedUrlResponse {
  fileId: string;        // UUID of created file record
  uploadUrl: string;     // Presigned PUT URL
  expiresAt: string;     // ISO timestamp
  key: string;           // S3 key for reference
}
```

**Validation:**
- Content-type must match allowed types for purpose
- Size must be within limits for purpose
- Storage quota must not be exceeded
- Entity must exist and be accessible (for attachments)

### POST /api/v1/files/:id/complete

Mark an upload as complete after successful upload to R2.

**Request:**
```typescript
interface CompleteUploadDto {
  // Optional: verify with checksum
  checksum?: string;
}
```

**Response:**
```typescript
interface FileResponse {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  purpose: string;
  downloadUrl: string;   // Presigned download URL
  createdAt: string;
}
```

**Side Effects:**
- Sets `completed_at` timestamp
- Updates `organizations.storage_used`
- If replacing (avatar/logo), soft-deletes previous file

### GET /api/v1/files/:id

Get file metadata and a presigned download URL.

**Response:**
```typescript
interface FileResponse {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  purpose: string;
  entityType?: string;
  entityId?: string;
  downloadUrl: string;   // Presigned download URL (1 hour validity)
  createdAt: string;
}
```

### DELETE /api/v1/files/:id

Soft-delete a file.

**Response:**
```typescript
interface DeleteResponse {
  success: boolean;
  message: string;
}
```

**Side Effects:**
- Sets `deleted_at` timestamp
- Does NOT immediately update storage_used (done by cleanup job)

### GET /api/v1/files

List files with optional filters.

**Query Parameters:**
```typescript
interface ListFilesQuery {
  purpose?: 'avatar' | 'logo' | 'attachment';
  entityType?: string;
  entityId?: string;
  page?: number;
  limit?: number;
}
```

**Response:**
```typescript
interface ListFilesResponse {
  data: FileResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

---

## 6. Storage Service

### R2/S3 Client Abstraction

```typescript
// apps/api/src/files/storage/storage.service.ts

interface StorageConfig {
  provider: 'r2' | 's3';
  accountId?: string;     // R2 only
  region?: string;        // S3 only
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl?: string;     // Optional CDN URL
}

interface StorageService {
  // Generate presigned URL for upload (PUT)
  generateUploadUrl(key: string, contentType: string, expiresIn?: number): Promise<string>;

  // Generate presigned URL for download (GET)
  generateDownloadUrl(key: string, expiresIn?: number): Promise<string>;

  // Delete object from storage
  deleteObject(key: string): Promise<void>;

  // Check if object exists
  objectExists(key: string): Promise<boolean>;

  // Get object metadata
  getObjectMetadata(key: string): Promise<{ contentType: string; size: number } | null>;
}
```

### R2 Implementation

```typescript
// apps/api/src/files/storage/r2-storage.service.ts

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class R2StorageService implements StorageService {
  private client: S3Client;
  private bucket: string;

  constructor(private configService: ConfigService) {
    const accountId = this.configService.get('R2_ACCOUNT_ID');
    this.bucket = this.configService.get('R2_BUCKET_NAME');

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.configService.get('R2_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('R2_SECRET_ACCESS_KEY'),
      },
    });
  }

  async generateUploadUrl(key: string, contentType: string, expiresIn = 900): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.client, command, { expiresIn });
  }

  async generateDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.client, command, { expiresIn });
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }));
  }

  async objectExists(key: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }));
      return true;
    } catch {
      return false;
    }
  }
}
```

### Key Generation Strategy

```typescript
// Key patterns for different purposes
const keyPatterns = {
  avatar: (userId: string, filename: string) =>
    `avatars/${userId}/${Date.now()}-${sanitize(filename)}`,

  logo: (orgId: string, filename: string) =>
    `logos/${orgId}/${Date.now()}-${sanitize(filename)}`,

  attachment: (orgId: string, entityType: string, entityId: string, filename: string) =>
    `attachments/${orgId}/${entityType}/${entityId}/${Date.now()}-${sanitize(filename)}`,
};
```

---

## 7. Worker Jobs

### cleanup-orphaned-files

Removes file records and R2 objects for uploads that were never completed.

```typescript
// apps/worker/src/handlers/cleanup-orphaned-files.handler.ts

interface CleanupOrphanedFilesPayload {
  olderThanHours?: number; // Default: 24
  batchSize?: number;      // Default: 100
}

// Job runs hourly via cron
// Queue: file-cleanup
// Schedule: 0 * * * * (every hour)

async function handle(job: Job<CleanupOrphanedFilesPayload>) {
  const olderThan = subHours(new Date(), job.data.olderThanHours ?? 24);

  // Find orphaned files (completed_at IS NULL, created_at < threshold)
  const orphanedFiles = await db
    .select()
    .from(files)
    .where(and(
      isNull(files.completedAt),
      lt(files.createdAt, olderThan)
    ))
    .limit(job.data.batchSize ?? 100);

  for (const file of orphanedFiles) {
    // Delete from R2
    await storageService.deleteObject(file.key);

    // Delete record
    await db.delete(files).where(eq(files.id, file.id));

    logger.info('Cleaned up orphaned file', { fileId: file.id, key: file.key });
  }

  return { deletedCount: orphanedFiles.length };
}
```

### cleanup-deleted-files

Permanently removes soft-deleted files after retention period.

```typescript
// apps/worker/src/handlers/cleanup-deleted-files.handler.ts

interface CleanupDeletedFilesPayload {
  olderThanDays?: number; // Default: 30
  batchSize?: number;     // Default: 100
}

// Job runs daily via cron
// Queue: file-cleanup
// Schedule: 0 2 * * * (2 AM daily)

async function handle(job: Job<CleanupDeletedFilesPayload>) {
  const olderThan = subDays(new Date(), job.data.olderThanDays ?? 30);

  // Find soft-deleted files past retention
  const deletedFiles = await db
    .select()
    .from(files)
    .where(and(
      isNotNull(files.deletedAt),
      lt(files.deletedAt, olderThan),
      isNotNull(files.completedAt) // Only completed files count toward quota
    ))
    .limit(job.data.batchSize ?? 100);

  // Group by org for storage update
  const byOrg = new Map<string, number>();

  for (const file of deletedFiles) {
    // Delete from R2
    await storageService.deleteObject(file.key);

    // Track storage to reclaim
    const current = byOrg.get(file.orgId) ?? 0;
    byOrg.set(file.orgId, current + file.size);

    // Delete record permanently
    await db.delete(files).where(eq(files.id, file.id));

    logger.info('Permanently deleted file', { fileId: file.id, key: file.key });
  }

  // Update storage used for each org
  for (const [orgId, reclaimedBytes] of byOrg) {
    await db
      .update(organizations)
      .set({
        storageUsed: sql`GREATEST(0, storage_used - ${reclaimedBytes})`
      })
      .where(eq(organizations.id, orgId));
  }

  return { deletedCount: deletedFiles.length, orgsUpdated: byOrg.size };
}
```

---

## 8. Frontend Components

### FileUploader Component

```typescript
// apps/web/src/components/files/file-uploader.tsx

interface FileUploaderProps {
  purpose: 'avatar' | 'logo' | 'attachment';
  entityType?: string;
  entityId?: string;
  maxSize?: number;
  accept?: string[];
  onUploadComplete?: (file: FileResponse) => void;
  onError?: (error: Error) => void;
  children?: React.ReactNode;
}

// Features:
// - Drag and drop support
// - Progress indicator
// - File type/size validation (client-side)
// - Automatic presigned URL request
// - Direct upload to R2
// - Completion callback
```

### AvatarUploader Component

```typescript
// apps/web/src/components/files/avatar-uploader.tsx

interface AvatarUploaderProps {
  currentUrl?: string;
  onUploadComplete?: (file: FileResponse) => void;
  size?: 'sm' | 'md' | 'lg';
}

// Features:
// - Circular preview
// - Click or drag to upload
// - Hover state with edit icon
// - Loading state during upload
// - Fallback to initials
```

### useFileUpload Hook

```typescript
// apps/web/src/hooks/use-file-upload.ts

interface UseFileUploadOptions {
  purpose: 'avatar' | 'logo' | 'attachment';
  entityType?: string;
  entityId?: string;
  onSuccess?: (file: FileResponse) => void;
  onError?: (error: Error) => void;
}

interface UseFileUploadReturn {
  upload: (file: File) => Promise<FileResponse>;
  isUploading: boolean;
  progress: number;
  error: Error | null;
  reset: () => void;
}

// Handles:
// 1. Request presigned URL from API
// 2. Upload file directly to R2
// 3. Mark upload as complete via API
// 4. Track progress during upload
```

---

## 9. Tasks

### Backend (apps/api)

#### 9.1 Create Files Module
- [ ] Create `apps/api/src/files/files.module.ts`
- [ ] Create `apps/api/src/files/files.controller.ts`
- [ ] Create `apps/api/src/files/files.service.ts`
- [ ] Create DTOs in `apps/api/src/files/dto/`
- [ ] Register module in AppModule

#### 9.2 Implement Storage Service
- [ ] Create `apps/api/src/files/storage/storage.interface.ts`
- [ ] Create `apps/api/src/files/storage/r2-storage.service.ts`
- [ ] Create `apps/api/src/files/storage/s3-storage.service.ts` (optional fallback)
- [ ] Create storage factory for provider selection
- [ ] Add configuration validation for storage credentials

#### 9.3 Create Files Endpoints
- [ ] Implement `POST /files/presigned-url` endpoint
- [ ] Implement `POST /files/:id/complete` endpoint
- [ ] Implement `GET /files/:id` endpoint
- [ ] Implement `DELETE /files/:id` endpoint
- [ ] Implement `GET /files` (list with filters)

#### 9.4 Add File Validation
- [ ] Create file validation service
- [ ] Implement content-type validation per purpose
- [ ] Implement file size validation per purpose
- [ ] Implement storage quota checking
- [ ] Add validation error messages

#### 9.5 Implement Presigned URL Generation
- [ ] Configure presigned URL expiration times
- [ ] Generate unique S3 keys with timestamp
- [ ] Handle upload URL generation
- [ ] Handle download URL generation
- [ ] Add caching for download URLs (optional)

### Database (packages/db)

#### 9.6 Add Files Schema
- [ ] Create `packages/db/src/schema/files.ts`
- [ ] Define files table with all columns
- [ ] Add proper indexes
- [ ] Export from schema index

#### 9.7 Add Files Migration
- [ ] Generate migration for files table
- [ ] Enable RLS on files table
- [ ] Create RLS policies (SELECT, INSERT, UPDATE, DELETE)
- [ ] Test migration applies cleanly

#### 9.8 Update Organizations Schema
- [ ] Add `storage_used` column (BIGINT, default 0)
- [ ] Add `storage_quota` column (BIGINT, default 1GB)
- [ ] Generate migration for schema change
- [ ] Update organization type exports

### Worker (apps/worker)

#### 9.9 Add File Cleanup Jobs
- [ ] Create `apps/worker/src/handlers/cleanup-orphaned-files.handler.ts`
- [ ] Create `apps/worker/src/handlers/cleanup-deleted-files.handler.ts`
- [ ] Register handlers with BullMQ
- [ ] Configure cron schedules
- [ ] Add job logging and metrics

#### 9.10 Configure File Cleanup Queue
- [ ] Create `file-cleanup` queue configuration
- [ ] Set up retry policies
- [ ] Configure dead letter queue
- [ ] Add admin endpoints for manual trigger (optional)

### Frontend (apps/web)

#### 9.11 Create FileUploader Component
- [ ] Create `apps/web/src/components/files/file-uploader.tsx`
- [ ] Implement drag-and-drop functionality
- [ ] Add progress indicator
- [ ] Add client-side validation
- [ ] Add error states and messages

#### 9.12 Create AvatarUploader Component
- [ ] Create `apps/web/src/components/files/avatar-uploader.tsx`
- [ ] Implement circular preview
- [ ] Add hover edit state
- [ ] Integrate with FileUploader
- [ ] Add loading skeleton

#### 9.13 Create useFileUpload Hook
- [ ] Create `apps/web/src/hooks/use-file-upload.ts`
- [ ] Implement presigned URL request
- [ ] Implement direct R2 upload with XHR (for progress)
- [ ] Implement completion notification
- [ ] Handle errors and retries

#### 9.14 Integration with User Settings
- [ ] Add avatar upload to profile settings page
- [ ] Handle avatar preview update
- [ ] Add success/error toast notifications

#### 9.15 Integration with Org Settings
- [ ] Add logo upload to organization settings page
- [ ] Restrict to OWNER role
- [ ] Handle logo preview update
- [ ] Add success/error toast notifications

---

## 10. Test Plan

### Unit Tests

#### Storage Service Tests
```typescript
describe('R2StorageService', () => {
  it('should generate valid upload presigned URL');
  it('should generate valid download presigned URL');
  it('should delete object from bucket');
  it('should check object existence');
  it('should handle non-existent objects gracefully');
});
```

#### File Validation Tests
```typescript
describe('FileValidationService', () => {
  it('should accept valid image types for avatar');
  it('should reject invalid types for avatar');
  it('should enforce size limits per purpose');
  it('should check storage quota before upload');
  it('should reject when quota would be exceeded');
});
```

#### Files Service Tests
```typescript
describe('FilesService', () => {
  it('should create file record and return presigned URL');
  it('should mark upload as complete');
  it('should update storage used on completion');
  it('should soft-delete file');
  it('should list files with filters');
  it('should replace previous avatar on new upload');
});
```

### Integration Tests

#### Upload Flow Tests
```typescript
describe('File Upload Integration', () => {
  it('should complete full upload flow: presign → upload → complete');
  it('should reject oversized files');
  it('should reject invalid content types');
  it('should reject when quota exceeded');
  it('should update storage used correctly');
});
```

#### Download Flow Tests
```typescript
describe('File Download Integration', () => {
  it('should return file metadata with download URL');
  it('should generate valid presigned download URL');
  it('should return 404 for non-existent file');
  it('should return 404 for deleted file');
});
```

#### RLS Tests
```typescript
describe('Files RLS', () => {
  it('should allow org member to view org files');
  it('should deny access to other org files');
  it('should allow file owner to delete');
  it('should allow OWNER role to delete any org file');
  it('should deny MEMBER from deleting others files');
});
```

### E2E Tests (with mocked R2)

#### Avatar Upload E2E
```typescript
describe('Avatar Upload E2E', () => {
  it('should upload avatar from user settings');
  it('should display uploaded avatar in profile');
  it('should replace existing avatar');
  it('should show error for invalid file');
});
```

#### Logo Upload E2E
```typescript
describe('Logo Upload E2E', () => {
  it('should upload logo from org settings');
  it('should display logo in org header');
  it('should only allow OWNER to upload');
  it('should show error for non-owners');
});
```

---

## 11. Environment Variables

```bash
# Cloudflare R2 (Primary)
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=forgestack-uploads
R2_PUBLIC_URL=https://uploads.example.com  # Optional CDN URL

# Optional S3 Fallback
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=

# Storage Configuration
STORAGE_PROVIDER=r2  # 'r2' or 's3'
MAX_UPLOAD_SIZE_MB=50
DEFAULT_STORAGE_QUOTA_GB=1
PRESIGNED_URL_UPLOAD_EXPIRY=900    # 15 minutes
PRESIGNED_URL_DOWNLOAD_EXPIRY=3600 # 1 hour
```

---

## 12. File Purpose Configuration

| Purpose | Max Size | Allowed Types | Storage Key Pattern |
|---------|----------|---------------|---------------------|
| avatar | 5MB | image/jpeg, image/png, image/gif, image/webp | `avatars/{user_id}/{timestamp}-{filename}` |
| logo | 5MB | image/jpeg, image/png, image/gif, image/webp, image/svg+xml | `logos/{org_id}/{timestamp}-{filename}` |
| attachment | 50MB | Configurable (default: all) | `attachments/{org_id}/{entity_type}/{entity_id}/{timestamp}-{filename}` |

---

## 13. File Structure

```
apps/api/src/
├── files/
│   ├── files.module.ts
│   ├── files.controller.ts
│   ├── files.service.ts
│   ├── file-validation.service.ts
│   ├── dto/
│   │   ├── create-presigned-url.dto.ts
│   │   ├── complete-upload.dto.ts
│   │   ├── file-response.dto.ts
│   │   └── list-files-query.dto.ts
│   └── storage/
│       ├── storage.interface.ts
│       ├── storage.factory.ts
│       ├── r2-storage.service.ts
│       └── s3-storage.service.ts

packages/db/src/
├── schema/
│   ├── files.ts
│   └── index.ts  # Update to export files
└── migrations/
    └── XXXX_add_files_table.ts

apps/worker/src/
├── handlers/
│   ├── cleanup-orphaned-files.handler.ts
│   └── cleanup-deleted-files.handler.ts
└── queues/
    └── file-cleanup.queue.ts

apps/web/src/
├── components/
│   └── files/
│       ├── file-uploader.tsx
│       ├── avatar-uploader.tsx
│       └── file-list.tsx
├── hooks/
│   └── use-file-upload.ts
└── app/(dashboard)/
    └── settings/
        ├── profile/
        │   └── page.tsx  # Avatar upload integration
        └── organization/
            └── page.tsx  # Logo upload integration
```

---

## 14. Security Considerations

1. **Never expose bucket credentials** – Frontend only receives presigned URLs
2. **Presigned URL expiration** – Upload URLs expire in 15 minutes, download in 1 hour
3. **RLS enforcement** – All file queries use `withTenantContext()`
4. **Content-Type validation** – Server validates MIME type before generating presigned URL
5. **File size limits** – Enforced at API level before presigned URL generation
6. **Storage quotas** – Prevent abuse and enable monetization
7. **Soft delete** – 30-day retention before permanent deletion
8. **No direct bucket access** – R2 bucket is not public; all access through presigned URLs
9. **Audit logging** – Log file operations for security review

---

## 15. Dependencies

### Backend Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@aws-sdk/client-s3` | `^3.x` | S3-compatible client for R2/S3 |
| `@aws-sdk/s3-request-presigner` | `^3.x` | Presigned URL generation |

### Frontend Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react-dropzone` | `^14.x` | Drag and drop file selection (optional) |

---

## 16. Future Enhancements

- **Image processing** – Automatic thumbnail generation via Cloudflare Images
- **CDN integration** – Public read access for avatars/logos via R2 public buckets
- **Virus scanning** – Integration with file scanning service
- **Usage analytics** – Track storage usage per org over time
- **Bulk operations** – Download multiple files as ZIP
- **File versioning** – Keep history of file changes

---

*Spec created following SDD methodology as defined in agents.md*

