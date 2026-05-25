import { Module, Global } from '@nestjs/common';
import { LogsController } from './logs.controller';
import { CustomLoggerService } from './custom-logger.service';

@Global()
@Module({
  controllers: [LogsController],
  providers: [CustomLoggerService],
  exports: [CustomLoggerService],
})
export class LogsModule {}
