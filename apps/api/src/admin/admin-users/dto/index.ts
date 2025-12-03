import { IsString, IsOptional, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Query DTO for listing users
 */
export class ListUsersQueryDto {
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
 * DTO for suspending a user
 */
export class SuspendUserDto {
  @IsString()
  reason!: string;
}

/**
 * User response DTO
 */
export class UserDto {
  id!: string;
  name!: string;
  email!: string;
  emailVerified!: boolean;
  image?: string | null;
  isSuperAdmin!: boolean;
  suspendedAt?: Date | null;
  suspendedReason?: string | null;
  suspendedBy?: string | null;
  lastLoginAt?: Date | null;
  createdAt!: Date;
  updatedAt!: Date;
}

/**
 * Paginated users response DTO
 */
export class PaginatedUsersDto {
  data!: UserDto[];
  pagination!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

