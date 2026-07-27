import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsObject,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';
import { SubscriptionStatus } from '@prisma/client';

export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  planId: string;

  @IsEnum(['MONTHLY', 'YEARLY'])
  @IsOptional()
  billingInterval?: 'MONTHLY' | 'YEARLY';

  @IsNumber()
  @IsOptional()
  trialDays?: number;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsBoolean()
  @IsOptional()
  startTrial?: boolean;
}

export class UpgradeSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  planId: string;

  @IsEnum(['MONTHLY', 'YEARLY'])
  @IsOptional()
  billingInterval?: 'MONTHLY' | 'YEARLY';

  @IsBoolean()
  @IsOptional()
  prorate?: boolean;
}

export class DowngradeSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  planId: string;
}

export class CancelSubscriptionDto {
  @IsBoolean()
  @IsOptional()
  immediate?: boolean;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class ResumeSubscriptionDto {
  @IsString()
  @IsOptional()
  planId?: string;
}

export class ChangeBillingIntervalDto {
  @IsEnum(['MONTHLY', 'YEARLY'])
  billingInterval: 'MONTHLY' | 'YEARLY';
}
