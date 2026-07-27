import { Controller, Get, Post, Body, UseGuards, Request, Delete, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(Role.TENANT_ADMIN)
  @Get()
  getUsers(@Request() req: any) {
    return this.usersService.getUsersByTenant(req.user.tenantId);
  }

  @Roles(Role.TENANT_ADMIN)
  @Post()
  createUser(@Request() req: any, @Body() body: any) {
    return this.usersService.createUser(req.user.tenantId, body);
  }

  @Roles(Role.TENANT_ADMIN)
  @Delete(':id')
  deleteUser(@Request() req: any, @Param('id') id: string) {
    return this.usersService.deleteUser(req.user.tenantId, id);
  }
}
