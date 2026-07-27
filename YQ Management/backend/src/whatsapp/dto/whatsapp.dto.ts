import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsBoolean,
} from 'class-validator';

export class UpdateWhatsappSettingsDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  instanceName?: string;

  @IsOptional()
  @IsObject()
  chatbotSettings?: any;

  @IsOptional()
  @IsObject()
  templates?: any;
}

export class TestMessageDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsOptional()
  @IsString()
  message?: string;
}
