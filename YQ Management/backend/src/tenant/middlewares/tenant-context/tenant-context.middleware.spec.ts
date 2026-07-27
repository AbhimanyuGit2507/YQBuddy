import { TenantContextMiddleware } from './tenant-context.middleware';

describe('TenantContextMiddleware', () => {
  it('should be defined', () => {
    expect(new TenantContextMiddleware()).toBeDefined();
  });
});
