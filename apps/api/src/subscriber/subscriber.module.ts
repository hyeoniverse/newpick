import { Logger, Module } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { SubscriberService } from './subscriber.service';
import { SubscriberController } from './subscriber.controller';
import { UnsubscribeController } from './unsubscribe.controller';

@Module({
  imports: [PrismaModule],
  exports: [SubscriberService],
  controllers: [SubscriberController, UnsubscribeController],
  providers: [SubscriberService, Logger],
})
export class SubscriberModule {}
