import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { UsersController } from './users.controller';
import { NetworkController } from './network.controller';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { NetworkService } from './network.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Country } from './entities/country.entity';
import { EmailModule } from '../email';
import { StoresModule } from '../stores/stores.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Country]),
    ConfigModule,
    PassportModule,
    StoresModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        global: true,
        secret:
          configService.get<string>('JWT_SECRET') ||
          'your-secret-key-change-in-production',
        signOptions: {
          expiresIn: '24h',
        },
      }),
    }),
    EmailModule,
  ],
  controllers: [AuthController, UsersController, NetworkController],
  providers: [AuthService, UsersService, NetworkService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
