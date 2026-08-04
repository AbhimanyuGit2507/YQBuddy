import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
  UnauthorizedException,
  Req,
  Query,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SuperAdminService } from './super-admin.service';
import type { EmailProvider } from '../communication/interfaces/email.provider';
import { CommunicationLogService, CommunicationChannel, CommunicationStatus } from '../communication/logging/communication-log.service';
import { TemplateService } from '../communication/templates/template.service';

@Controller('super-admin')
@UseGuards(AuthGuard('jwt'))
export class SuperAdminController {
  constructor(
    private readonly superAdminService: SuperAdminService,
    @Inject('EmailProvider') private readonly emailProvider: EmailProvider,
    private readonly communicationLogService: CommunicationLogService,
    private readonly templateService: TemplateService,
  ) {}

  private checkSuperAdmin(req: any) {
    if (req.user?.role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException('Access denied. Super Admin only.');
    }
  }

  @Get('metrics')
  async getMetrics(@Req() req: any) {
    this.checkSuperAdmin(req);
    return this.superAdminService.getGlobalMetrics();
  }

  @Get('tenants')
  async getTenants(@Req() req: any, @Query('search') search?: string) {
    this.checkSuperAdmin(req);
    return this.superAdminService.getAllTenants({ search });
  }

  @Get('tenants/:id')
  async getTenantById(@Req() req: any, @Param('id') id: string) {
    this.checkSuperAdmin(req);
    return this.superAdminService.getTenantById(id);
  }

  @Delete('tenants/:id')
  async deleteTenant(@Req() req: any, @Param('id') id: string) {
    this.checkSuperAdmin(req);
    return this.superAdminService.deleteTenant(id);
  }

  @Get('users')
  async getUsers(@Req() req: any, @Query('search') search?: string, @Query('role') role?: string) {
    this.checkSuperAdmin(req);
    return this.superAdminService.getAllUsers({ search, role });
  }

  @Post('users')
  async createUser(@Req() req: any, @Body() body: { email: string; role: string; tenantId: string }) {
    this.checkSuperAdmin(req);
    return this.superAdminService.createUser(body);
  }

  @Patch('users/:id')
  async updateUser(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    this.checkSuperAdmin(req);
    return this.superAdminService.updateUser(id, body);
  }

  @Delete('users/:id')
  async deleteUser(@Req() req: any, @Param('id') id: string) {
    this.checkSuperAdmin(req);
    return this.superAdminService.deleteUser(id);
  }

  @Get('subscriptions')
  async getSubscriptions(@Req() req: any) {
    this.checkSuperAdmin(req);
    const subs = await this.superAdminService.getAllSubscriptions();
    return { subscriptions: subs };
  }

  @Get('analytics')
  async getAnalytics(@Req() req: any) {
    this.checkSuperAdmin(req);
    return this.superAdminService.getPlatformAnalytics();
  }

  @Get('transactions')
  async getTransactions(@Req() req: any) {
    this.checkSuperAdmin(req);
    return this.superAdminService.getRecentTransactions();
  }

  @Get('plans')
  async listPlans(@Req() req: any, @Query('status') statusFilter?: string, @Query('offset') offset?: number, @Query('limit') limit?: number) {
    this.checkSuperAdmin(req);
    return this.superAdminService.listPlans(statusFilter, offset ?? 0, limit ?? 50);
  }

  @Post('plans')
  async createPlan(@Req() req: any, @Body() dto: any) {
    this.checkSuperAdmin(req);
    return this.superAdminService.createPlan(dto);
  }

  @Put('plans/:id')
  async updatePlan(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    this.checkSuperAdmin(req);
    return this.superAdminService.updatePlan(id, dto);
  }

  @Delete('plans/:id')
  async archivePlan(@Req() req: any, @Param('id') id: string) {
    this.checkSuperAdmin(req);
    return this.superAdminService.archivePlan(id);
  }

  @Patch('plans/:id/status')
  async changePlanStatus(@Req() req: any, @Param('id') id: string, @Body() dto: { status: string }) {
    this.checkSuperAdmin(req);
    return this.superAdminService.changePlanStatus(id, dto.status);
  }

  @Post('plans/:id/duplicate')
  async duplicatePlan(@Req() req: any, @Param('id') id: string, @Body() dto: { name: string }) {
    this.checkSuperAdmin(req);
    return this.superAdminService.duplicatePlan(id, dto.name);
  }

  @Get('communication/email/connection')
  async testEmailConnection(@Req() req: any) {
    this.checkSuperAdmin(req);
    const connected = await this.emailProvider.testConnection();
    return { connected, configured: !!process.env.BREVO_API_KEY };
  }

  @Post('communication/test-email')
  async testEmail(@Req() req: any, @Body() body: { to: string; subject?: string }) {
    this.checkSuperAdmin(req);
    const result = await this.emailProvider.send({
      to: body.to,
      subject: body.subject || 'Qmova Test Email',
      htmlContent: '<h1>Test Email</h1><p>This is a test email from Qmova.</p>',
      textContent: 'Test Email - This is a test email from Qmova.',
    });
    await this.communicationLogService.log({
      channel: CommunicationChannel.EMAIL,
      type: 'test',
      recipient: body.to,
      subject: body.subject || 'Qmova Test Email',
      body: 'Test Email - This is a test email from Qmova.',
      status: result.success ? CommunicationStatus.SENT : CommunicationStatus.FAILED,
      provider: 'brevo',
      providerId: result.providerId,
      errorMessage: result.error,
    });
    return { success: result.success, error: result.error };
  }

  @Get('communication/templates/email')
  getEmailTemplates(@Req() req: any) {
    this.checkSuperAdmin(req);
    return this.templateService.getEmailTemplateKeys().map((key: string) => ({
      key,
      name: key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
    }));
  }

  @Get('communication/templates/whatsapp')
  getWhatsAppTemplates(@Req() req: any) {
    this.checkSuperAdmin(req);
    const defaultKeys = this.templateService.getWhatsAppTemplateKeys();
    return defaultKeys.map((key: string) => ({
      key,
      name: key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
    }));
  }

  @Get('communication/logs')
  async getCommunicationLogs(
    @Req() req: any,
    @Query('offset') offset?: number,
    @Query('limit') limit?: number,
  ) {
    this.checkSuperAdmin(req);
    return this.communicationLogService.getFailedLogs();
  }
}