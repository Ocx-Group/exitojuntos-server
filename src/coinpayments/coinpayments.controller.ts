import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CoinpaymentsService } from './coinpayments.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import {
  CreateMerchantWalletDto,
  SpendRequestDto,
} from './dto/spend-request.dto';

@ApiTags('CoinPayments')
@Controller({ path: 'coinpayments', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class CoinpaymentsController {
  constructor(private readonly coinpaymentsService: CoinpaymentsService) {}

  @Post('invoices')
  @ApiOperation({ summary: 'Crear una factura de pago en CoinPayments' })
  async createInvoice(@Body() dto: CreateInvoiceDto) {
    const response = await this.coinpaymentsService.createInvoice(
      dto.amount,
      dto.items,
      {
        currency: dto.currency,
        description: dto.description,
        notificationsUrl: dto.notificationsUrl,
      },
    );
    return this.coinpaymentsService.parse(response);
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Obtener una factura por id' })
  async getInvoice(@Param('id') id: string) {
    return this.coinpaymentsService.parse(
      await this.coinpaymentsService.getInvoice(id),
    );
  }

  @Get('currencies')
  @ApiOperation({ summary: 'Listar las monedas soportadas' })
  async getCurrencies() {
    return this.coinpaymentsService.parse(
      await this.coinpaymentsService.getCurrencies(),
    );
  }

  @Get('wallets')
  @ApiOperation({ summary: 'Listar los wallets del merchant' })
  async getMerchantWallets() {
    return this.coinpaymentsService.parse(
      await this.coinpaymentsService.getMerchantWallets(),
    );
  }

  @Post('wallets')
  @ApiOperation({ summary: 'Crear un wallet de merchant' })
  async createMerchantWallet(@Body() dto: CreateMerchantWalletDto) {
    return this.coinpaymentsService.parse(
      await this.coinpaymentsService.createMerchantWallet(
        dto.currencyId,
        dto.label,
      ),
    );
  }

  @Post('wallets/:walletId/spend')
  @ApiOperation({ summary: 'Crear una solicitud de retiro/conversión' })
  async createSpendRequest(
    @Param('walletId') walletId: string,
    @Body() dto: SpendRequestDto,
  ) {
    return this.coinpaymentsService.parse(
      await this.coinpaymentsService.createSpendRequest(walletId, dto),
    );
  }

  @Post('wallets/:walletId/spend/:spendRequestId/confirm')
  @ApiOperation({ summary: 'Confirmar una solicitud de retiro pendiente' })
  async confirmSpendRequest(
    @Param('walletId') walletId: string,
    @Param('spendRequestId') spendRequestId: string,
  ) {
    return this.coinpaymentsService.parse(
      await this.coinpaymentsService.confirmSpendRequest(
        walletId,
        spendRequestId,
      ),
    );
  }
}
