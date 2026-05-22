import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { CountriesModule } from './countries/countries.module';
import { EmailModule } from './email';
import { LogsModule } from './logs';
import { TestimonialsModule } from './testimonials';
import { StorageModule } from './storage/storage.module';

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
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number.parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
      },
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
