import { Controller, Injectable, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AmqpConnection } from './amqp/AmqpConnection';
import { RabbitRPC, RabbitSubscribe } from './rabbitmq.decorators';
import { RabbitMQModule } from './rabbitmq.module';

@Injectable()
class ExampleService {
  @RabbitRPC({
    routingKey: 'rpc',
    exchange: 'exchange1'
  })
  rpcMethod() {}

  @RabbitSubscribe({
    routingKey: 'subscribe',
    exchange: 'exchange2'
  })
  subscribeMethod() {}
}

@Controller('example-controller')
class ExampleController {
  @RabbitRPC({
    routingKey: 'rpc',
    exchange: 'exchange3'
  })
  rpcMethod() {}

  @RabbitSubscribe({
    routingKey: 'subscribe',
    exchange: 'exchange4'
  })
  controllerSubscribeMethod() {}
}

@Module({
  providers: [ExampleService],
  controllers: [ExampleController]
})
class ExampleModule {}

describe('RabbitMQ', () => {
  let app: TestingModule;
  let amqpMock: AmqpConnection;

  beforeEach(async () => {
    app = await Test.createTestingModule({
      imports: [RabbitMQModule, ExampleModule]
    })
      .overrideProvider(AmqpConnection)
      .useValue({
        createRpc: jest.fn(),
        createSubscriber: jest.fn()
      })
      .compile();

    await app.init();
    amqpMock = app.get<AmqpConnection>(AmqpConnection);
  });

  it('should register rabbit rpc handlers', async () => {
    expect(amqpMock.createRpc).toHaveBeenCalledWith(expect.any(Function), {
      exchange: 'exchange1',
      routingKey: 'rpc'
    });

    expect(amqpMock.createRpc).toHaveBeenCalledWith(expect.any(Function), {
      exchange: 'exchange3',
      routingKey: 'rpc'
    });

    expect(amqpMock.createRpc).toBeCalledTimes(2);
  });

  it('should register rabbit subscribe handlers', async () => {
    expect(amqpMock.createSubscriber).toBeCalledWith(expect.any(Function), {
      exchange: 'exchange2',
      routingKey: 'subscribe'
    });

    expect(amqpMock.createSubscriber).toBeCalledWith(expect.any(Function), {
      exchange: 'exchange4',
      routingKey: 'subscribe'
    });

    expect(amqpMock.createSubscriber).toBeCalledTimes(2);
  });
});
