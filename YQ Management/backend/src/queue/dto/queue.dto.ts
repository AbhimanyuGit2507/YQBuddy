import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsBoolean,
  IsNumber,
  IsArray,
} from 'class-validator';
import { QueueStatus } from '@prisma/client';

export class CreateQueueDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsArray()
  formConfig?: any;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsNumber()
  maxTokens?: number;

  @IsOptional()
  @IsString()
  location?: string;
}

export class UpdateQueueDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  formConfig?: any;

  @IsOptional()
  @IsString()
  nextQueueId?: string | null;

  @IsOptional()
  @IsBoolean()
  allowAppointments?: boolean;

  @IsOptional()
  @IsBoolean()
  requireManualCheckIn?: boolean;

  @IsOptional()
  @IsNumber()
  appointmentGranularityMins?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsNumber()
  maxTokens?: number;

  @IsOptional()
  @IsString()
  location?: string;
}

export class UpdateStatusDto {
  status: QueueStatus;
}
