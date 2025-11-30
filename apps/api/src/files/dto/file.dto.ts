/**
 * DTOs for file responses
 */

export class FileDto {
  id!: string;
  filename!: string;
  contentType!: string;
  size!: number;
  purpose!: string;
  entityType?: string;
  entityId?: string;
  url!: string;
  createdAt!: string;
}

export class PaginatedFilesDto {
  data!: FileDto[];
  pagination!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

