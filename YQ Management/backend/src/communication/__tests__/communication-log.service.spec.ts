import { Test, TestingModule } from '@nestjs/testing';
import { CommunicationLogService, CommunicationChannel, CommunicationStatus } from '../logging/communication-log.service';
import { PrismaModule } from '../../prisma/prisma.module';

describe('CommunicationLogService', () => {
  let service: CommunicationLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [CommunicationLogService],
    }).compile();

    service = module.get<CommunicationLogService>(CommunicationLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should log communication entry', async () => {
    const mockCreate = jest.spyOn(service['prisma'].communicationLog, 'create').mockResolvedValue({} as any);

    await service.log({
      channel: CommunicationChannel.EMAIL,
      type: 'test',
      recipient: 'test@example.com',
      body: 'test body',
      status: CommunicationStatus.SENT,
      provider: 'brevo',
    });

    expect(mockCreate).toHaveBeenCalled();
  });

  it('should get logs with pagination', async () => {
    const mockFindMany = jest.spyOn(service['prisma'].communicationLog, 'findMany').mockResolvedValue([]);
    const mockCount = jest.spyOn(service['prisma'].communicationLog, 'count').mockResolvedValue(0);

    const result = await service.getLogs('workspace-1', 1, 50);

    expect(mockFindMany).toHaveBeenCalled();
    expect(mockCount).toHaveBeenCalled();
    expect(result.logs).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('should get failed logs', async () => {
    const mockFindMany = jest.spyOn(service['prisma'].communicationLog, 'findMany').mockResolvedValue([]);

    const result = await service.getFailedLogs('workspace-1');

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { workspaceId: 'workspace-1', status: CommunicationStatus.FAILED },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    expect(result).toEqual([]);
  });
});
