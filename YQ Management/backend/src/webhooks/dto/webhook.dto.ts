import { IsString, IsObject, IsOptional, IsEnum } from 'class-validator';
import { WebhookEventType } from '@prisma/client';

export class ProcessWebhookDto {
  @IsString()
  @IsOptional()
  providerEventId?: string;

  @IsEnum(Object.values(WebhookEventType))
  @IsOptional()
  eventType?: string;

  @IsObject()
  payload: Record<string, unknown>;

  @IsObject()
  @IsOptional()
  headers?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  signature?: string;

  @IsString()
  @IsOptional()
  idempotencyKey?: string;
}