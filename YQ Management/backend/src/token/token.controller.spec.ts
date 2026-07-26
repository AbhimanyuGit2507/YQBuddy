import { Test, TestingModule } from '@nestjs/testing';
import { TokenController } from './token.controller';
import { TokenModule } from '../token/token.module';
import { CommunicationModule } from '../communication/communication.module';

describe('TokenController', () => {
  let controller: TokenController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TokenController],
      imports: [TokenModule, CommunicationModule],
    }).compile();

    controller = module.get<TokenController>(TokenController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
