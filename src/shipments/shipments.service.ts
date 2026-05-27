import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { getPagination, toPaginatedResult } from '../common/utils/pagination.util';
import { OrdersService } from '../orders/orders.service';
import { AddTrackingEventDto } from './dto/add-tracking-event.dto';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { ShipmentTracking } from './entities/shipment-tracking.entity';
import { Shipment } from './entities/shipment.entity';

@Injectable()
export class ShipmentsService {
  constructor(
    @InjectRepository(Shipment)
    private readonly shipmentRepository: Repository<Shipment>,
    @InjectRepository(ShipmentTracking)
    private readonly trackingRepository: Repository<ShipmentTracking>,
    private readonly ordersService: OrdersService,
  ) {}

  async create(dto: CreateShipmentDto): Promise<Shipment> {
    await this.ordersService.findOne(dto.orderId);
    const shipment = this.shipmentRepository.create({
      orderId: dto.orderId,
      carrier: dto.carrier,
      trackingNumber: dto.trackingNumber,
      estimatedDelivery: dto.estimatedDelivery,
      status: 'pending',
    });
    return this.shipmentRepository.save(shipment);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Shipment>> {
    const { page, limit, skip } = getPagination(paginationDto);
    const [shipments, total] = await this.shipmentRepository.findAndCount({
      relations: ['order', 'trackingEvents'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return toPaginatedResult(shipments, total, page, limit);
  }

  async findOne(id: number): Promise<Shipment> {
    const shipment = await this.shipmentRepository.findOne({
      where: { id },
      relations: ['order', 'trackingEvents'],
      order: { trackingEvents: { occurredAt: 'DESC' } } as any,
    });
    if (!shipment) throw new NotFoundException(`Envío ${id} no encontrado`);
    return shipment;
  }

  async findByOrder(orderId: number, userId?: number): Promise<Shipment> {
    await this.ordersService.findOne(orderId, userId);

    const shipment = await this.shipmentRepository.findOne({
      where: { orderId },
      relations: ['trackingEvents'],
    });
    if (!shipment) throw new NotFoundException(`No se encontró envío para la orden ${orderId}`);
    return shipment;
  }

  async update(id: number, dto: UpdateShipmentDto): Promise<Shipment> {
    const shipment = await this.findOne(id);
    Object.assign(shipment, dto);
    if (dto.status === 'delivered') shipment.deliveredAt = new Date();
    return this.shipmentRepository.save(shipment);
  }

  async addTrackingEvent(id: number, dto: AddTrackingEventDto): Promise<Shipment> {
    const shipment = await this.findOne(id);
    const event = this.trackingRepository.create({
      shipmentId: shipment.id,
      status: dto.status,
      location: dto.location,
      description: dto.description,
    });
    await this.trackingRepository.save(event);
    return this.findOne(id);
  }
}
