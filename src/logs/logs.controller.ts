import {
  Controller,
  Get,
  Query,
  Delete,
  UseGuards,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CustomLoggerService } from './custom-logger.service';
import { GetLogsDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Logs')
@ApiBearerAuth()
@Controller({ path: 'logs', version: VERSION_NEUTRAL })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class LogsController {
  constructor(private readonly loggerService: CustomLoggerService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener logs de la aplicación (Solo Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de logs obtenida correctamente',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado - Solo Admin' })
  getLogs(@Query() getLogsDto: GetLogsDto) {
    return this.loggerService.getLogs(getLogsDto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas de logs (Solo Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas de logs obtenidas correctamente',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado - Solo Admin' })
  getStats() {
    return this.loggerService.getStats();
  }

  @Delete()
  @ApiOperation({ summary: 'Limpiar todos los logs (Solo Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Logs eliminados correctamente',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado - Solo Admin' })
  clearLogs() {
    return this.loggerService.clearLogs();
  }
}
