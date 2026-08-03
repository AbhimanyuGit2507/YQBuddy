import { Controller, Get } from '@nestjs/common';
import { PlansService } from './plans.service';

@Controller('public/plans')
export class PublicPlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  async getActivePlans() {
    // Only return ACTIVE plans to the public API
    const plans = await this.plansService.listPlans('ACTIVE', 0, 50);
    return plans;
  }
}
