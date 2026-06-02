import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Logger,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { COINPAYMENTS_ALL_WEBHOOK_EVENTS } from './constants/coinpayments.constants';
import { CoinpaymentsCheckoutService } from './coinpayments-checkout.service';
import { CoinpaymentsService } from './coinpayments.service';

/**
 * Recibe las notificaciones (webhooks) de CoinPayments.
 * Endpoint público (sin JWT): la autenticidad se valida con la firma HMAC.
 */
@ApiExcludeController()
@SkipThrottle()
@Controller({ path: 'coinpayments/webhook', version: '1' })
export class CoinpaymentsWebhookController {
  private readonly logger = new Logger(CoinpaymentsWebhookController.name);

  constructor(
    private readonly coinpaymentsService: CoinpaymentsService,
    private readonly checkoutService: CoinpaymentsCheckoutService,
  ) {}

  /**
   * Verificación de salud del endpoint. CoinPayments (y los navegadores) hacen un
   * GET para comprobar que la URL del webhook es accesible; las notificaciones
   * reales llegan por POST con firma.
   */
  @Get()
  @HttpCode(200)
  healthCheck(): { status: string } {
    return { status: 'ok' };
  }

  @Post()
  @HttpCode(200)
  async handle(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-coinpayments-signature') signature: string | undefined,
    @Headers('x-coinpayments-client') clientId: string | undefined,
    @Headers('x-coinpayments-timestamp') timestamp: string | undefined,
    @Body() payload: Record<string, unknown>,
  ): Promise<{ received: boolean }> {
    // El cuerpo crudo es necesario para validar la firma exactamente como se envió.
    const rawBody = req.rawBody?.toString('utf8') ?? '';

    const valid = this.coinpaymentsService.verifyWebhookSignature({
      rawBody,
      signature,
      clientId,
      timestamp,
    });
    if (!valid) {
      throw new UnauthorizedException('Firma de webhook inválida');
    }

    const event = this.resolveEvent(payload);
    if (!event || !COINPAYMENTS_ALL_WEBHOOK_EVENTS.has(event.toLowerCase())) {
      throw new BadRequestException(`Evento de webhook desconocido: ${event}`);
    }

    this.logger.log(`Webhook recibido: ${event}`);
    await this.checkoutService.processWebhookEvent(event, payload);

    return { received: true };
  }

  /** Extrae el tipo de evento del payload (CoinPayments lo envía en `type`). */
  private resolveEvent(payload: Record<string, unknown>): string | undefined {
    const type = payload?.['type'] ?? payload?.['event'];
    return typeof type === 'string' ? type : undefined;
  }
}
