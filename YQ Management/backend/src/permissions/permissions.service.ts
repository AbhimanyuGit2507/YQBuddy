import { Injectable } from '@nestjs/common';
import {
  hasAllPermissions,
  hasPermission,
  Permission,
  rolePermissions,
} from './permissions.enum';

@Injectable()
export class PermissionsService {
  getPermissionsForRole(role: string): Permission[] {
    return [...(rolePermissions[role] || [])];
  }

  hasPermission(role: string, permission: Permission): boolean {
    return hasPermission(role, permission);
  }

  hasAllPermissions(role: string, permissions: Permission[]): boolean {
    return hasAllPermissions(role, permissions);
  }
}
