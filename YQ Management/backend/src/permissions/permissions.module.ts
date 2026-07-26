import { Module } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';
import { PermissionsService } from './permissions.service';

@Module({
  providers: [PermissionsGuard, PermissionsService],
  exports: [PermissionsGuard, PermissionsService],
})
export class PermissionsModule {}
