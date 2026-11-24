import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SuscripcionAlerta } from './entities/suscripcion-alerta.entity';
import { Macrodistrito } from './entities/macrodistrito.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SuscripcionAlerta, Macrodistrito])],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
