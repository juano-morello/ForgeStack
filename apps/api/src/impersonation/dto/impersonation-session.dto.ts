/**
 * DTOs for impersonation session responses
 */

import { ApiProperty } from '@nestjs/swagger';

export class ImpersonationUserDto {
  @ApiProperty({ example: 'user-uuid' })
  id!: string;

  @ApiProperty({ example: 'john@example.com' })
  email!: string;

  @ApiProperty({ example: 'John Doe', nullable: true })
  name!: string | null;
}

export class ImpersonationSessionDto {
  @ApiProperty({ example: 'session-uuid' })
  sessionId!: string;

  @ApiProperty({ type: ImpersonationUserDto })
  targetUser!: ImpersonationUserDto;

  @ApiProperty({ example: '2024-01-15T10:00:00Z' })
  startedAt!: string;

  @ApiProperty({ example: '2024-01-15T11:00:00Z' })
  expiresAt!: string;

  @ApiProperty({ example: 3600, description: 'Remaining seconds until expiration' })
  remainingSeconds!: number;
}

export class StartImpersonationResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: ImpersonationSessionDto })
  impersonation!: ImpersonationSessionDto;
}

export class EndImpersonationResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({
    type: 'object',
    properties: {
      duration: { type: 'number', example: 1800 },
      actionsPerformed: { type: 'number', example: 15 },
      endedAt: { type: 'string', example: '2024-01-15T10:30:00Z' },
    },
  })
  session!: {
    duration: number;
    actionsPerformed: number;
    endedAt: string;
  };
}

export class GetImpersonationStatusResponseDto {
  @ApiProperty({ example: true })
  isImpersonating!: boolean;

  @ApiProperty({ type: ImpersonationSessionDto, nullable: true })
  session!: ImpersonationSessionDto | null;
}

export class ActiveImpersonationSessionDto {
  @ApiProperty({ example: 'session-uuid' })
  sessionId!: string;

  @ApiProperty({ type: ImpersonationUserDto })
  actor!: ImpersonationUserDto;

  @ApiProperty({ type: ImpersonationUserDto })
  targetUser!: ImpersonationUserDto;

  @ApiProperty({ example: '2024-01-15T10:00:00Z' })
  startedAt!: string;

  @ApiProperty({ example: '2024-01-15T11:00:00Z' })
  expiresAt!: string;
}

export class ListActiveSessionsResponseDto {
  @ApiProperty({ type: [ActiveImpersonationSessionDto] })
  sessions!: ActiveImpersonationSessionDto[];

  @ApiProperty({ example: 1 })
  count!: number;
}

