import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    sub: string;
    email: string;
    role: string;
    workspaceId: string;
    tenantId: string;
    personalSettings?: any;
    isNewUser?: boolean;
  };
}
