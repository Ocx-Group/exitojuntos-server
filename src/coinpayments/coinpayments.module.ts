import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OrdersModule } from '../orders/orders.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { CoinpaymentsCheckoutController } from './coinpayments-checkout.controller';
import { CoinpaymentsCheckoutService } from './coinpayments-checkout.service';
import { CoinpaymentsController } from './coinpayments.controller';
import { CoinpaymentsWebhookController } from './coinpayments-webhook.controller';
import { CoinpaymentsService } from './coinpayments.service';

@Module({
  imports: [ConfigModule, OrdersModule, TransactionsModule],
  controllers: [
    CoinpaymentsController,
    CoinpaymentsCheckoutController,
    CoinpaymentsWebhookController,
  ],
  providers: [CoinpaymentsService, CoinpaymentsCheckoutService],
  exports: [CoinpaymentsService],
})
export class CoinpaymentsModule {}
