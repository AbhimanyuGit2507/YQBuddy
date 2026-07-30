import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsObject,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SubscriptionStatus } from '@prisma/client';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  planId: string;

  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsEnum(['MONTHLY', 'YEARLY'])
  @IsOptional()
  billingInterval?: 'MONTHLY' | 'YEARLY';
}

export class PaymentStatusDto {
  @IsString()
  @IsNotEmpty()
  transactionRef: string;
}

export class RefundPaymentDto {
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class VerifyPaymentDto {
  @IsString()
  @IsNotEmpty()
  paymentReference: string;
}
