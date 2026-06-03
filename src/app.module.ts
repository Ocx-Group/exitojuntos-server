import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { CountriesModule } from './countries/countries.module';
import { EmailModule } from './email';
import { LogsModule } from './logs';
import { TestimonialsModule } from './testimonials';
import { StorageModule } from './storage/storage.module';
import { ProductsModule } from './products/products.module';
import { StoresModule } from './stores/stores.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ShipmentsModule } from './shipments/shipments.module';
import { CoinpaymentsModule } from './coinpayments';

const envFilePath = process.env.NODE_ENV
  ? [
      `.env.${process.env.NODE_ENV}.local`,
      `.env.${process.env.NODE_ENV}`,
      '.env.local',
      '.env',
    ]
  : ['.env.local', '.env'];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: Number.parseInt(
            configService.get<string>('THROTTLE_TTL') ?? '60000',
            10,
          ),
          limit: Number.parseInt(
            configService.get<string>('THROTTLE_LIMIT') ?? '100',
            10,
          ),
        },
      ],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number.parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'exitojuntos',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false, // Solo en desarrollo
      logging: process.env.NODE_ENV === 'development',
      ssl: {
        rejectUnauthorized: false, // DigitalOcean requiere SSL
      },
    }),
    AuthModule,
    RolesModule,
    CountriesModule,
    EmailModule,
    LogsModule,
    TestimonialsModule,
    StorageModule,
    ProductsModule,
    StoresModule,
    CartModule,
    OrdersModule,
    TransactionsModule,
    ShipmentsModule,
    CoinpaymentsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
