import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionsService } from './transactions.service';

@ApiTags('Transacciones')
@Controller({ path: 'transactions', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear transacción' })
  create(@Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las transacciones' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.transactionsService.findAll(paginationDto);
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Listar transacciones de una orden' })
  findByOrder(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.transactionsService.findByOrder(orderId, paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener transacción por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.transactionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar transacción (webhook/admin)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(id, dto);
  }
}
