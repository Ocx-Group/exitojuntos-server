import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import {
  COINPAYMENTS_ALL_WEBHOOK_EVENTS,
  COINPAYMENTS_WEBHOOK_EVENTS,
} from './constants/coinpayments.constants';
import { CoinpaymentsService } from './coinpayments.service';

/**
 * Recibe las notificaciones (webhooks) de CoinPayments.
 * Endpoint público (sin JWT): la autenticidad se valida con la firma HMAC.
 */
@ApiExcludeController()
@Controller({ path: 'coinpayments/webhook', version: '1' })
export class CoinpaymentsWebhookController {
  private readonly logger = new Logger(CoinpaymentsWebhookController.name);

  constructor(private readonly coinpaymentsService: CoinpaymentsService) {}

  @Post()
  @HttpCode(200)
  handle(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-coinpayments-signature') signature: string | undefined,
    @Body() payload: Record<string, unknown>,
  ): { received: boolean } {
    // El cuerpo crudo es necesario para validar la firma exactamente como se envió.
    const rawBody = req.rawBody?.toString('utf8') ?? '';

    if (!this.coinpaymentsService.verifyWebhookSignature(rawBody, signature)) {
      throw new UnauthorizedException('Firma de webhook inválida');
    }

    const event = this.resolveEvent(payload);
    if (!event || !COINPAYMENTS_ALL_WEBHOOK_EVENTS.has(event.toLowerCase())) {
      throw new BadRequestException(`Evento de webhook desconocido: ${event}`);
    }

    this.logger.log(`Webhook recibido: ${event}`);
    this.dispatch(event, payload);

    return { received: true };
  }

  /** Extrae el tipo de evento del payload (CoinPayments lo envía en `type`). */
  private resolveEvent(payload: Record<string, unknown>): string | undefined {
    const type = payload?.['type'] ?? payload?.['event'];
    return typeof type === 'string' ? type : undefined;
  }

  /**
   * Punto de integración con el dominio. Aquí se debe actualizar el estado de la
   * orden/transacción según el evento recibido (p. ej. marcar la orden como pagada).
   */
  private dispatch(event: string, payload: Record<string, unknown>): void {
    switch (event.toLowerCase()) {
      case COINPAYMENTS_WEBHOOK_EVENTS.InvoicePaid.toLowerCase():
      case COINPAYMENTS_WEBHOOK_EVENTS.InvoiceCompleted.toLowerCase():
        // TODO: marcar la orden/transacción asociada como pagada.
        break;
      case COINPAYMENTS_WEBHOOK_EVENTS.InvoiceCancelled.toLowerCase():
      case COINPAYMENTS_WEBHOOK_EVENTS.InvoiceTimedOut.toLowerCase():
        // TODO: marcar la orden/transacción asociada como cancelada/expirada.
        break;
      default:
        this.logger.debug(`Evento sin manejador específico: ${event}`);
    }
    void payload;
  }
}
