/**
 * Activity DTOs
 * Response formats for activity data
 */

export class ActivityActorDto {
  id!: string;
  name!: string;
  avatar?: string;
}

export class ActivityResourceDto {
  type!: string;
  id!: string;
  name!: string;
}

export class ActivityDto {
  id!: string;
  type!: string;
  title!: string;
  description?: string;
  actor!: ActivityActorDto;
  resource?: ActivityResourceDto;
  aggregationCount!: number;
  metadata?: Record<string, unknown>;
  createdAt!: string;
}

export class PaginatedActivitiesDto {
  data!: ActivityDto[];
  pagination!: {
    cursor?: string;
    hasMore: boolean;
  };
}

