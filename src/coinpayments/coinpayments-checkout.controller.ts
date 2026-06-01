import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/entities/user.entity';
import {
  CheckoutSessionResult,
  CoinpaymentsCheckoutService,
} from './coinpayments-checkout.service';
import { CheckoutDto } from './dto/checkout.dto';

/**
 * Endpoint de checkout para el usuario final. Disponible para cualquier usuario
 * autenticado: crea la orden + transacción desde SU carrito y genera la factura
 * de CoinPayments. El monto se calcula en el servidor.
 */
@ApiTags('CoinPayments')
@Controller({ path: 'coinpayments/checkout', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CoinpaymentsCheckoutController {
  constructor(private readonly checkoutService: CoinpaymentsCheckoutService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear orden + pago de CoinPayments a partir del carrito',
  })
  checkout(
    @GetUser() user: User,
    @Body() dto: CheckoutDto,
  ): Promise<CheckoutSessionResult> {
    return this.checkoutService.createCheckout(user, dto);
  }
}
