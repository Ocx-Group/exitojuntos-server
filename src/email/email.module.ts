import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BrevoService } from './brevo.service';
import { EmailService } from './email.service';

@Module({
  imports: [ConfigModule],
  providers: [BrevoService, EmailService],
  exports: [EmailService, BrevoService],
})
export class EmailModule {}
