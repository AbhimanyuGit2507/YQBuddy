import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentProviderName } from '@prisma/client';
import { PaymentProvider } from '../interfaces/payment-provider.interface';
import { OzowProvider } from '../../payments/providers/ozow.provider';

@Injectable()
export class ProviderRegistry {
  private providers: Map<PaymentProviderName, PaymentProvider> = new Map();

  constructor(prisma: PrismaService) {
    this.providers.set(
      PaymentProviderName.OZOW,
      new OzowProvider(prisma),
    );
  }

  getProvider(name: PaymentProviderName): PaymentProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Payment provider "${name}" is not registered`);
    }
    return provider;
  }

  getAllProviders(): PaymentProvider[] {
    return Array.from(this.providers.values());
  }

  registerProvider(name: PaymentProviderName, provider: PaymentProvider): void {
    this.providers.set(name, provider);
  }
}