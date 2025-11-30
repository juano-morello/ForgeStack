/**
 * Notification Preferences DTOs
 * Request and response formats for notification preferences
 */

import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class NotificationPreferenceDto {
  id!: string;
  userId!: string;
  orgId?: string;
  type!: string;
  inAppEnabled!: boolean;
  emailEnabled!: boolean;
  createdAt!: string;
  updatedAt!: string;
}

export class UpdatePreferencesDto {
  @IsString()
  type!: string;

  @IsOptional()
  @IsBoolean()
  inAppEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;
}

