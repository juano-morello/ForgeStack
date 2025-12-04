/**
 * Notification Preferences DTOs
 * Request and response formats for notification preferences
 */

import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NotificationPreferenceDto {
  @ApiProperty({ description: 'Preference ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  userId!: string;

  @ApiProperty({ description: 'Organization ID', required: false, example: '123e4567-e89b-12d3-a456-426614174000' })
  orgId?: string;

  @ApiProperty({ description: 'Notification type', example: 'project.created' })
  type!: string;

  @ApiProperty({ description: 'Whether in-app notifications are enabled', example: true })
  inAppEnabled!: boolean;

  @ApiProperty({ description: 'Whether email notifications are enabled', example: false })
  emailEnabled!: boolean;

  @ApiProperty({ description: 'Creation timestamp', example: '2024-12-04T12:00:00Z' })
  createdAt!: string;

  @ApiProperty({ description: 'Last update timestamp', example: '2024-12-04T12:00:00Z' })
  updatedAt!: string;
}

export class UpdatePreferencesDto {
  @ApiProperty({
    description: 'Notification type to update preferences for',
    example: 'project.created'
  })
  @IsString()
  type!: string;

  @ApiProperty({
    description: 'Enable/disable in-app notifications',
    required: false,
    example: true
  })
  @IsOptional()
  @IsBoolean()
  inAppEnabled?: boolean;

  @ApiProperty({
    description: 'Enable/disable email notifications',
    required: false,
    example: false
  })
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;
}

