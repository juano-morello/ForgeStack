import { IsString, IsUrl, IsArray, IsOptional, IsBoolean, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { WEBHOOK_EVENTS, type WebhookEventType } from '../webhook-events';

export class UpdateEndpointDto {
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  url?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one event must be selected' })
  @ArrayMaxSize(WEBHOOK_EVENTS.length)
  @IsString({ each: true })
  events?: WebhookEventType[];

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

