import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit';

export function Audit(action: string, resource: string) {
  return SetMetadata(AUDIT_KEY, { action, resource });
}
