import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { LogEntry } from './interfaces/log-entry.interface';
import { GetLogsDto } from './dto';

@Injectable({ scope: Scope.DEFAULT })
export class CustomLoggerService implements LoggerService {
  private logs: LogEntry[] = [];
  private readonly maxLogs = 10000; // Máximo de logs en memoria

  log(message: string, context?: string) {
    this.addLog('LOG', message, context);
    console.log(
      `[Nest] ${process.pid}  - ${this.formatDate()}     LOG [${context || 'Application'}] ${message}`,
    );
  }

  error(message: string, trace?: string, context?: string) {
    this.addLog('ERROR', `${message}${trace ? ` - ${trace}` : ''}`, context);
    console.error(
      `[Nest] ${process.pid}  - ${this.formatDate()}   ERROR [${context || 'Application'}] ${message}`,
      trace || '',
    );
  }

  warn(message: string, context?: string) {
    this.addLog('WARN', message, context);
    console.warn(
      `[Nest] ${process.pid}  - ${this.formatDate()}    WARN [${context || 'Application'}] ${message}`,
    );
  }

  debug(message: string, context?: string) {
    this.addLog('DEBUG', message, context);
    console.debug(
      `[Nest] ${process.pid}  - ${this.formatDate()}   DEBUG [${context || 'Application'}] ${message}`,
    );
  }

  verbose(message: string, context?: string) {
    this.addLog('VERBOSE', message, context);
    console.log(
      `[Nest] ${process.pid}  - ${this.formatDate()} VERBOSE [${context || 'Application'}] ${message}`,
    );
  }

  private addLog(level: string, message: string, context?: string) {
    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      context: context || 'Application',
      message,
      pid: process.pid,
    };

    this.logs.push(logEntry);

    // Limitar el tamaño del array de logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Eliminar el log más antiguo
    }
  }

  private formatDate(): string {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const time = now.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    return `${day}/${month}/${year}, ${time}`;
  }

  getLogs(getLogsDto: GetLogsDto) {
    const page: number = getLogsDto.page ?? 1;
    const limit: number = getLogsDto.limit ?? 50;
    const { level, context, search } = getLogsDto;

    // Filtrar logs
    let filteredLogs: LogEntry[] = [...this.logs];

    if (level) {
      filteredLogs = filteredLogs.filter((log) => log.level === String(level));
    }

    if (context) {
      const contextLower: string = context.toLowerCase();
      filteredLogs = filteredLogs.filter((log) =>
        log.context.toLowerCase().includes(contextLower),
      );
    }

    if (search) {
      const searchLower: string = search.toLowerCase();
      filteredLogs = filteredLogs.filter((log) =>
        log.message.toLowerCase().includes(searchLower),
      );
    }

    // Ordenar por timestamp descendente (más recientes primero)
    filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Paginación
    const total: number = filteredLogs.length;
    const startIndex: number = (page - 1) * limit;
    const endIndex: number = startIndex + limit;
    const paginatedLogs: LogEntry[] = filteredLogs.slice(startIndex, endIndex);

    return {
      data: paginatedLogs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  clearLogs() {
    const count = this.logs.length;
    this.logs = [];
    return { message: `${count} logs eliminados correctamente` };
  }

  getStats() {
    const stats = {
      total: this.logs.length,
      byLevel: {
        LOG: 0,
        ERROR: 0,
        WARN: 0,
        DEBUG: 0,
        VERBOSE: 0,
      },
      oldestLog: this.logs.length > 0 ? this.logs[0].timestamp : null,
      newestLog:
        this.logs.length > 0 ? this.logs[this.logs.length - 1].timestamp : null,
    };

    this.logs.forEach((log) => {
      if (log.level in stats.byLevel) {
        stats.byLevel[log.level]++;
      }
    });

    return stats;
  }
}
