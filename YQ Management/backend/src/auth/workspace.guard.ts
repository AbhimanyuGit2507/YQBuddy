import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class WorkspaceGuard {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;
    if (!user.workspaceId && !user.tenantId) {
      throw new NotFoundException(
        'No workspace found. Please create or join a workspace.',
      );
    }
    return true;
  }
}
