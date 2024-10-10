import { Test, TestingModule } from '@nestjs/testing';
import { ChatGetwayGateway } from './chat-getway.gateway';

describe('ChatGetwayGateway', () => {
  let gateway: ChatGetwayGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatGetwayGateway],
    }).compile();

    gateway = module.get<ChatGetwayGateway>(ChatGetwayGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
