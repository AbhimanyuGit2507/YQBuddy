import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto } from './dto/plan.dto';
import { UpdatePlanDto } from './dto/plan.dto';
import { Plan } from '@prisma/client';

@Injectable()
export class PlansService {
  private readonly logger = new Logger(PlansService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listPlans(
    statusFilter?: string,
    offset = 0,
    limit = 50,
  ): Promise<Plan[]> {
    const where: Record<string, unknown> = {};
    if (statusFilter) {
      where.status = statusFilter;
    }
    return this.prisma.plan.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async getPlan(id: string): Promise<Plan> {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) {
      throw new NotFoundException(`Plan with id ${id} not found`);
    }
    return plan;
  }

  async createPlan(dto: CreatePlanDto): Promise<Plan> {
    const plan = await this.prisma.plan.create({
      data: {
        name: dto.name,
        description: dto.description,
        type: dto.type || 'STANDARD',
        status: (dto.status || 'ACTIVE') as any,
        billingInterval: dto.billingInterval || 'MONTHLY',
        price: dto.price ?? 0,
        currency: dto.currency || 'ZAR',
        trialDays: dto.trialDays ?? 0,
        features: (dto.features ?? null) as any,
        limits: (dto.limits ?? null) as any,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
    this.logger.log(`Plan created: ${plan.name} (${plan.id})`);
    return plan;
  }

  async updatePlan(id: string, dto: UpdatePlanDto): Promise<Plan> {
    const existing = await this.getPlan(id);
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.billingInterval !== undefined) data.billingInterval = dto.billingInterval;
    if (dto.price !== undefined) data.price = dto.price;
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.trialDays !== undefined) data.trialDays = dto.trialDays;
    if (dto.features !== undefined) data.features = dto.features;
    if (dto.limits !== undefined) data.limits = dto.limits;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;

    const updated = await this.prisma.plan.update({
      where: { id },
      data,
    });
    this.logger.log(`Plan updated: ${updated.name} (${updated.id})`);
    return updated;
  }

  async changePlanStatus(id: string, status: string): Promise<Plan> {
    const existing = await this.getPlan(id);
    const updated = await this.prisma.plan.update({
      where: { id },
      data: { status: status as any },
    });
    this.logger.log(`Plan ${id} status changed to ${status}`);
    return updated;
  }

  async duplicatePlan(id: string, newName: string): Promise<Plan> {
    const existing = await this.getPlan(id);
    const duplicated = await this.prisma.plan.create({
      data: {
        name: newName,
        description: existing.description ?? undefined,
        type: existing.type,
        billingInterval: existing.billingInterval,
        price: existing.price,
        currency: existing.currency,
        trialDays: existing.trialDays,
        features: existing.features ?? undefined,
        limits: existing.limits ?? undefined,
        status: 'ACTIVE',
        sortOrder: existing.sortOrder,
      },
    });
    this.logger.log(`Plan duplicated: ${existing.name} -> ${duplicated.name}`);
    return duplicated;
  }

  async archivePlan(id: string): Promise<Plan> {
    const existing = await this.getPlan(id);
    const archived = await this.prisma.plan.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
    this.logger.log(`Plan archived: ${archived.name} (${archived.id})`);
    return archived;
  }
}