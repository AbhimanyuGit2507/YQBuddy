import {
  Injectable,
  NestMiddleware,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { WorkspaceService } from '../../workspace.service';

export interface RequestWithWorkspace extends Request {
  workspace: any;
}

@Injectable()
export class WorkspaceContextMiddleware implements NestMiddleware {
  constructor(private readonly workspaceService: WorkspaceService) {}

  async use(req: RequestWithWorkspace, res: Response, next: NextFunction) {
    const host = req.headers.host;
    if (!host) {
      throw new BadRequestException('Host header is missing');
    }

    const manualSubdomain = req.headers['x-workspace-subdomain'] as string;
    let subdomain = manualSubdomain;

    if (!subdomain) {
      const parts = host.split('.');
      if (parts.length > 1) {
        subdomain = parts[0];
      }
    }

    if (!subdomain) {
      return next(); // Don't block requests without subdomain, as admin routes use JWT
    }

    try {
      const workspace =
        await this.workspaceService.getWorkspaceBySubdomain(subdomain);
      req.workspace = workspace;
      next();
    } catch (err) {
      next(err);
    }
  }
}
