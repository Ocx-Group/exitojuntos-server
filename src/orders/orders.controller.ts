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
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { User } from '../auth/entities/user.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { FilterOrdersDto } from './dto/filter-orders.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@ApiTags('Órdenes')
@Controller({ path: 'orders', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Crear orden desde carrito' })
  create(@GetUser() user: User, @Body() dto: CreateOrderDto) {
    return this.ordersService.createFromCart(user.id, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Listar mis órdenes' })
  findMine(@GetUser() user: User, @Query() paginationDto: PaginationDto) {
    return this.ordersService.findAllByUser(user.id, paginationDto);
  }

  @Get('my/:id')
  @ApiOperation({ summary: 'Ver detalle de una orden propia' })
  findMyOne(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id, user.id);
  }

  @Patch('my/:id/cancel')
  @ApiOperation({ summary: 'Cancelar una orden propia' })
  cancel(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.ordersService.cancel(id, user.id);
  }

  @Get('store-sales')
  @ApiOperation({ summary: 'Ventas atribuidas a mi tienda' })
  findStoreSales(
    @GetUser() user: User,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.ordersService.findStoreSales(user.id, paginationDto);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Listar todas las órdenes (admin)' })
  findAll(@Query() dto: FilterOrdersDto) {
    return this.ordersService.findAll(dto);
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Ver orden por ID (admin)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  @Roles('admin')
  @ApiOperation({ summary: 'Actualizar estado de orden (admin)' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto);
  }
}
