import { PipeTransform, BadRequestException } from '@nestjs/common';

export class UuidPipe implements PipeTransform {
  transform(value: string): string {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new BadRequestException('Invalid UUID format');
    }
    return value;
  }
}

export class PhonePipe implements PipeTransform {
  transform(value: string): string {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length < 10 || cleaned.length > 15) {
      throw new BadRequestException('Invalid phone number format');
    }
    return cleaned;
  }
}

export class EmailPipe implements PipeTransform {
  transform(value: string): string {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new BadRequestException('Invalid email format');
    }
    return value;
  }
}

export class SubdomainPipe implements PipeTransform {
  transform(value: string): string {
    const subdomainRegex = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/i;
    if (!subdomainRegex.test(value)) {
      throw new BadRequestException('Invalid subdomain format. Use only lowercase letters, numbers, and hyphens.');
    }
    return value.toLowerCase();
  }
}
