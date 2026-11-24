import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('macrodistritos')
  async getMacrodistritos() {
    return this.subscriptionsService.getMacrodistritos();
  }

  @Get('users/subscriptions')
  @UseGuards(JwtAuthGuard)
  async getSubscriptions(@CurrentUser('idUsuario') idUsuario: number) {
    return this.subscriptionsService.getUserSubscriptions(idUsuario);
  }

  @Post('users/subscriptions')
  @UseGuards(JwtAuthGuard)
  async createSubscription(
    @CurrentUser('idUsuario') idUsuario: number,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.subscriptionsService.createSubscription(idUsuario, dto.idMacrodistrito);
  }

  @Delete('users/subscriptions/:id')
  @UseGuards(JwtAuthGuard)
  async removeSubscription(
    @CurrentUser('idUsuario') idUsuario: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.subscriptionsService.removeSubscription(idUsuario, id);
  }
}
