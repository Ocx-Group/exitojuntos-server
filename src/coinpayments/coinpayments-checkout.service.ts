import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { User } from '../auth/entities/user.entity';
import { OrdersService } from '../orders/orders.service';
import { Order } from '../orders/entities/order.entity';
import { CreateOrderDto } from '../orders/dto/create-order.dto';
import { TransactionsService } from '../transactions/transactions.service';
import { CoinpaymentsService } from './coinpayments.service';
import { COINPAYMENTS_WEBHOOK_EVENTS } from './constants/coinpayments.constants';
import { CheckoutDto } from './dto/checkout.dto';
import {
  CoinPaymentsApiResponse,
  CreateInvoiceResult,
  InvoiceLineItem,
} from './interfaces/coinpayments.interface';

/** Sesión de checkout normalizada que consume el frontend. */
export interface CheckoutSessionResult {
  orderId: number;
  transactionId: number;
  invoiceId: string;
  checkoutUrl: string;
  statusUrl: string;
  qrCodeUrl: string;
  amount: number;
  status: string;
  expiresAt: string;
}

/**
 * Orquesta el flujo de pago con CoinPayments:
 *  - checkout: crea la orden (pending_payment) y la transacción (pending) desde el
 *    carrito y genera la factura enlazada por `invoiceId`/`customData`.
 *  - webhook: actualiza la orden y la transacción según el evento recibido.
 */
@Injectable()
export class CoinpaymentsCheckoutService {
  private readonly logger = new Logger(CoinpaymentsCheckoutService.name);

  constructor(
    private readonly coinpaymentsService: CoinpaymentsService,
    private readonly ordersService: OrdersService,
    private readonly transactionsService: TransactionsService,
  ) {}

  /** Crea la orden + transacción + factura de CoinPayments a partir del carrito. */
  async createCheckout(
    user: User,
    dto: CheckoutDto,
  ): Promise<CheckoutSessionResult> {
    const order = await this.ordersService.createFromCart(
      user.id,
      this.buildOrderDto(user, dto),
    );

    const transaction = await this.transactionsService.create({
      orderId: order.id,
      type: 'payment',
      amount: Number(order.total),
      currency: order.currency,
      paymentMethod: 'coinpayments',
    });

    const response = await this.coinpaymentsService.createInvoice(
      Number(order.total),
      this.buildInvoiceItems(order),
      {
        description: `Pedido #${order.id} - Éxito Juntos`,
        invoiceId: String(order.id),
        customData: {
          orderId: String(order.id),
          transactionId: String(transaction.id),
        },
      },
    );

    const parsed = this.coinpaymentsService.parse(response) as
      | CoinPaymentsApiResponse<CreateInvoiceResult>
      | CreateInvoiceResult;
    const invoice = this.extractInvoice(parsed);
    if (!invoice) {
      throw new BadRequestException(
        'CoinPayments no devolvió una factura válida',
      );
    }

    await this.transactionsService.update(transaction.id, {
      gatewayResponse: {
        coinpaymentsInvoiceId: invoice.id,
        checkoutLink: invoice.checkoutLink,
        status: invoice.status,
      },
    });

    return {
      orderId: order.id,
      transactionId: transaction.id,
      invoiceId: invoice.id,
      checkoutUrl: invoice.checkoutLink,
      statusUrl: invoice.link,
      qrCodeUrl: invoice.qrCodeUrl,
      amount: Number(order.total),
      status: invoice.status,
      expiresAt: invoice.expiresAt,
    };
  }

  /**
   * Procesa un evento de webhook ya verificado: localiza la orden/transacción por
   * `customData`/`invoiceId` y actualiza sus estados. Es best-effort (siempre se
   * responde 200 a CoinPayments) e idempotente.
   */
  async processWebhookEvent(
    event: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const orderId = this.resolveOrderId(payload);
    if (!orderId) {
      this.logger.warn(
        `Webhook ${event} sin orderId resoluble en customData/invoiceId.`,
      );
      return;
    }

    let order: Order;
    try {
      order = await this.ordersService.findOne(orderId);
    } catch {
      this.logger.warn(`Webhook ${event}: orden ${orderId} no encontrada.`);
      return;
    }

    const transaction =
      await this.transactionsService.findLatestPaymentByOrder(orderId);

    switch (event.toLowerCase()) {
      case COINPAYMENTS_WEBHOOK_EVENTS.InvoicePaid.toLowerCase():
      case COINPAYMENTS_WEBHOOK_EVENTS.InvoiceCompleted.toLowerCase():
        if (order.status === 'pending_payment') {
          await this.ordersService.updateStatus(orderId, { status: 'paid' });
        }
        if (transaction && transaction.status !== 'approved') {
          await this.transactionsService.update(transaction.id, {
            status: 'approved',
          });
        }
        this.logger.log(`Orden ${orderId} marcada como pagada (${event}).`);
        break;

      case COINPAYMENTS_WEBHOOK_EVENTS.InvoiceCancelled.toLowerCase():
      case COINPAYMENTS_WEBHOOK_EVENTS.InvoiceTimedOut.toLowerCase():
        if (order.status === 'pending_payment') {
          await this.ordersService.updateStatus(orderId, {
            status: 'cancelled',
          });
        }
        if (
          transaction &&
          transaction.status !== 'approved' &&
          transaction.status !== 'failed'
        ) {
          await this.transactionsService.update(transaction.id, {
            status: event.toLowerCase().includes('timedout')
              ? 'failed'
              : 'cancelled',
            failureReason: `Webhook: ${event}`,
          });
        }
        this.logger.log(`Orden ${orderId} cancelada/expirada (${event}).`);
        break;

      case COINPAYMENTS_WEBHOOK_EVENTS.InvoicePending.toLowerCase():
      case COINPAYMENTS_WEBHOOK_EVENTS.InvoicePaymentCreated.toLowerCase():
        if (transaction && transaction.status === 'pending') {
          await this.transactionsService.update(transaction.id, {
            status: 'awaiting_confirmations',
          });
        }
        break;

      default:
        this.logger.debug(`Evento de webhook sin manejador: ${event}`);
    }
  }

  // ── Internos ──────────────────────────────────────────────────────

  /** Completa los datos de envío con el perfil del usuario cuando faltan. */
  private buildOrderDto(user: User, dto: CheckoutDto): CreateOrderDto {
    const shippingEmail = dto.shippingEmail ?? user.email;
    const shippingName =
      dto.shippingName ?? `${user.name} ${user.lastName}`.trim();
    const shippingAddress = dto.shippingAddress ?? user.address;
    const shippingCity = dto.shippingCity ?? user.city;
    const shippingProvince = dto.shippingProvince ?? user.state;

    if (!shippingAddress || !shippingCity || !shippingProvince) {
      throw new BadRequestException(
        'Faltan datos de envío (dirección, ciudad, provincia). Complétalos en tu perfil o envíalos en el checkout.',
      );
    }

    return {
      shippingEmail,
      shippingName,
      shippingAddress,
      shippingCity,
      shippingProvince,
      shippingPostalCode: dto.shippingPostalCode ?? user.zipCode ?? undefined,
      shippingPhone: dto.shippingPhone ?? user.phone ?? undefined,
      shippingCost: dto.shippingCost,
      notes: dto.notes,
    };
  }

  /**
   * Genera los ítems de la factura. Se usa una línea resumen con el total de la
   * orden para garantizar que el monto cobrado coincide exactamente con la orden
   * (incluye impuestos/envío/descuentos ya calculados en el total).
   */
  private buildInvoiceItems(order: Order): InvoiceLineItem[] {
    return [
      {
        name: `Pedido #${order.id}`,
        quantity: 1,
        amount: Number(order.total),
      },
    ];
  }

  private extractInvoice(
    parsed: CoinPaymentsApiResponse<CreateInvoiceResult> | CreateInvoiceResult,
  ): CreateInvoiceResult | null {
    const wrapper = parsed as CoinPaymentsApiResponse<CreateInvoiceResult>;
    if (Array.isArray(wrapper.invoices)) {
      return wrapper.invoices[0] ?? null;
    }
    const flat = parsed as CreateInvoiceResult;
    return flat.id || flat.checkoutLink ? flat : null;
  }

  /** Resuelve el id de la orden desde customData.orderId o el invoiceId del comercio. */
  private resolveOrderId(payload: Record<string, unknown>): number | null {
    const invoice = this.asRecord(payload['invoice']) ?? payload;
    const customData =
      this.asRecord(invoice['customData']) ??
      this.asRecord(payload['customData']);

    const candidate =
      customData?.['orderId'] ?? invoice['invoiceId'] ?? payload['invoiceId'];

    const orderId = Number(candidate);
    return Number.isInteger(orderId) && orderId > 0 ? orderId : null;
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : null;
  }
}
