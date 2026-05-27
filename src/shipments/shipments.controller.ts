import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AddTrackingEventDto } from './dto/add-tracking-event.dto';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { ShipmentsService } from './shipments.service';

@ApiTags('Envíos')
@Controller({ path: 'shipments', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Crear envío para una orden (admin)' })
  create(@Body() dto: CreateShipmentDto) {
    return this.shipmentsService.create(dto);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Listar todos los envíos (admin)' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.shipmentsService.findAll(paginationDto);
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Obtener envío por orden' })
  findByOrder(
    @GetUser() user: RequestWithUser['user'],
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    const userId = user.role === 'admin' ? undefined : user.id;
    return this.shipmentsService.findByOrder(orderId, userId);
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Obtener envío por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.shipmentsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Actualizar estado de envío (admin)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateShipmentDto) {
    return this.shipmentsService.update(id, dto);
  }

  @Post(':id/tracking')
  @Roles('admin')
  @ApiOperation({ summary: 'Agregar evento de tracking (admin)' })
  addTracking(@Param('id', ParseIntPipe) id: number, @Body() dto: AddTrackingEventDto) {
    return this.shipmentsService.addTrackingEvent(id, dto);
  }
}
