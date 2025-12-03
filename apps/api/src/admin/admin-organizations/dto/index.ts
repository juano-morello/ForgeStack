import { IsString, IsOptional, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Query DTO for listing organizations
 */
export class ListOrganizationsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  suspended?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 50;
}

/**
 * DTO for suspending an organization
 */
export class SuspendOrganizationDto {
  @IsString()
  reason!: string;
}

/**
 * DTO for transferring ownership
 */
export class TransferOwnershipDto {
  @IsString()
  newOwnerId!: string;
}

/**
 * Organization response DTO
 */
export class OrganizationDto {
  id!: string;
  name!: string;
  ownerUserId!: string;
  suspendedAt?: Date | null;
  suspendedReason?: string | null;
  suspendedBy?: string | null;
  createdAt!: Date;
}

/**
 * Paginated organizations response DTO
 */
export class PaginatedOrganizationsDto {
  data!: OrganizationDto[];
  pagination!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

