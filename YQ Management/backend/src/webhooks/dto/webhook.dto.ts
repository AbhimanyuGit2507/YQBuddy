import {
  IsString,
  IsObject,
  IsOptional,
  IsEnum,
  IsArray,
  IsNotEmpty,
} from 'class-validator';
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

export class CreateWebhookDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsOptional()
  @IsString()
  secret?: string;

  @IsArray()
  @IsOptional()
  events?: string[];
}
