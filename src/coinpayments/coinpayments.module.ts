import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CartModule } from '../cart/cart.module';
import { CoinpaymentsCheckoutController } from './coinpayments-checkout.controller';
import { CoinpaymentsController } from './coinpayments.controller';
import { CoinpaymentsWebhookController } from './coinpayments-webhook.controller';
import { CoinpaymentsService } from './coinpayments.service';

@Module({
  imports: [ConfigModule, CartModule],
  controllers: [
    CoinpaymentsController,
    CoinpaymentsCheckoutController,
    CoinpaymentsWebhookController,
  ],
  providers: [CoinpaymentsService],
  exports: [CoinpaymentsService],
})
export class CoinpaymentsModule {}
