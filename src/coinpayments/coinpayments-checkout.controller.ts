import {
  BadRequestException,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/entities/user.entity';
import { CartService } from '../cart/cart.service';
import { CoinpaymentsService } from './coinpayments.service';
import {
  CoinPaymentsApiResponse,
  CreateInvoiceResult,
  InvoiceLineItem,
} from './interfaces/coinpayments.interface';

/** Sesión de checkout normalizada que consume el frontend. */
export interface CheckoutSessionResult {
  invoiceId: string;
  checkoutUrl: string;
  statusUrl: string;
  qrCodeUrl: string;
  amount: number;
  status: string;
  expiresAt: string;
}

/**
 * Endpoint de checkout para el usuario final.
 * A diferencia de CoinpaymentsController (solo admin), está disponible para
 * cualquier usuario autenticado y construye la factura a partir de SU carrito,
 * de modo que el monto se calcula en el servidor y no se confía en el cliente.
 */
@ApiTags('CoinPayments')
@Controller({ path: 'coinpayments/checkout', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CoinpaymentsCheckoutController {
  constructor(
    private readonly coinpaymentsService: CoinpaymentsService,
    private readonly cartService: CartService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un pago de CoinPayments a partir del carrito del usuario',
  })
  async checkout(@GetUser() user: User): Promise<CheckoutSessionResult> {
    const cart = await this.cartService.getOrCreateActiveCart(user.id);

    if (!cart.items?.length) {
      throw new BadRequestException('El carrito está vacío');
    }

    const items: InvoiceLineItem[] = cart.items.map((item) => ({
      name: item.product?.name ?? `Producto ${item.productId}`,
      quantity: item.quantity,
      amount: Number(item.product?.price ?? item.unitPrice),
    }));

    const total = items.reduce(
      (sum, item) => sum + item.amount * item.quantity,
      0,
    );

    const response = await this.coinpaymentsService.createInvoice(
      total,
      items,
      { description: `Pedido de ${user.email}` },
    );

    const parsed = this.coinpaymentsService.parse(response);

    const invoice = this.extractInvoice(
      parsed as
        | CoinPaymentsApiResponse<CreateInvoiceResult>
        | CreateInvoiceResult,
    );
    if (!invoice) {
      throw new BadRequestException(
        'CoinPayments no devolvió una factura válida',
      );
    }

    return {
      invoiceId: invoice.id,
      checkoutUrl: invoice.checkoutLink,
      statusUrl: invoice.link,
      qrCodeUrl: invoice.qrCodeUrl,
      amount: Math.round(total * 100) / 100,
      status: invoice.status,
      expiresAt: invoice.expiresAt,
    };
  }

  /**
   * Extrae la factura de la respuesta, sea que venga envuelta en `invoices[]`
   * o como objeto plano.
   */
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
}
