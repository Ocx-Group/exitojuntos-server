import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CartService } from '../cart/cart.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { getPagination, toPaginatedResult } from '../common/utils/pagination.util';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderDetail } from './entities/order-detail.entity';
import { Order, OrderStatus } from './entities/order.entity';

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ['paid', 'cancelled'],
  paid:            ['processing', 'cancelled', 'refunded'],
  processing:      ['shipped', 'cancelled'],
  shipped:         ['delivered'],
  delivered:       ['refunded'],
  cancelled:       [],
  refunded:        [],
};

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderDetail)
    private readonly detailRepository: Repository<OrderDetail>,
    private readonly cartService: CartService,
  ) {}

  async createFromCart(userId: number, dto: CreateOrderDto): Promise<Order> {
    const cart = await this.cartService.getOrCreateActiveCart(userId);

    if (!cart.items?.length) {
      throw new BadRequestException('El carrito está vacío');
    }

    const orderDetails = cart.items.map((item) => {
      if (!item.product?.state) {
        throw new BadRequestException(
          `El producto ${item.productId} no está disponible`,
        );
      }

      const unitPrice = this.toMoney(item.product.price);
      const discountPercent = this.toNumber(item.product.discountPercent);
      const taxPercent = this.toNumber(item.product.taxPercent);
      const lineSubtotal = this.toMoney(unitPrice * item.quantity);
      const lineDiscount = this.toMoney(lineSubtotal * (discountPercent / 100));
      const taxableAmount = this.toMoney(lineSubtotal - lineDiscount);
      const lineTax = this.toMoney(taxableAmount * (taxPercent / 100));

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        discountPercent,
        taxPercent,
        lineSubtotal,
        lineDiscount,
        lineTax,
      };
    });

    const subtotal = this.toMoney(
      orderDetails.reduce((sum, detail) => sum + detail.lineSubtotal, 0),
    );
    const discountAmount = this.toMoney(
      orderDetails.reduce((sum, detail) => sum + detail.lineDiscount, 0),
    );
    const taxAmount = this.toMoney(
      orderDetails.reduce((sum, detail) => sum + detail.lineTax, 0),
    );

    const order = this.orderRepository.create({
      userId,
      currency: dto.currency ?? 'USD',
      subtotal,
      taxAmount,
      discountAmount,
      shippingCost: dto.shippingCost ?? 0,
      notes: dto.notes,
      shippingEmail: dto.shippingEmail,
      shippingName: dto.shippingName,
      shippingAddress: dto.shippingAddress,
      shippingCity: dto.shippingCity,
      shippingProvince: dto.shippingProvince,
      shippingPostalCode: dto.shippingPostalCode,
      shippingPhone: dto.shippingPhone,
      status: 'pending_payment',
    });

    const savedOrder = await this.orderRepository.save(order);

    const details = orderDetails.map((detail) =>
      this.detailRepository.create({
        orderId: savedOrder.id,
        productId: detail.productId,
        quantity: detail.quantity,
        unitPrice: detail.unitPrice,
        discountPercent: detail.discountPercent,
        taxPercent: detail.taxPercent,
      }),
    );
    await this.detailRepository.save(details);

    await this.cartService.abandonCart(userId);

    return this.findOne(savedOrder.id, userId);
  }

  private toNumber(value: unknown): number {
    const numberValue = Number(value ?? 0);
    if (!Number.isFinite(numberValue)) {
      throw new BadRequestException('El carrito contiene precios inválidos');
    }
    return numberValue;
  }

  private toMoney(value: unknown): number {
    return Math.round(this.toNumber(value) * 100) / 100;
  }

  async findAllByUser(
    userId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Order>> {
    const { page, limit, skip } = getPagination(paginationDto);
    const [orders, total] = await this.orderRepository.findAndCount({
      where: { userId, deletedAt: IsNull() },
      relations: ['details', 'details.product'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return toPaginatedResult(orders, total, page, limit);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Order>> {
    const { page, limit, skip } = getPagination(paginationDto);
    const [orders, total] = await this.orderRepository.findAndCount({
      where: { deletedAt: IsNull() },
      relations: ['user', 'details'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return toPaginatedResult(orders, total, page, limit);
  }

  async findOne(id: number, userId?: number): Promise<Order> {
    const where: any = { id, deletedAt: IsNull() };
    if (userId !== undefined) where.userId = userId;
    const order = await this.orderRepository.findOne({
      where,
      relations: ['details', 'details.product', 'user'],
    });
    if (!order) throw new NotFoundException(`Orden ${id} no encontrada`);
    return order;
  }

  async updateStatus(id: number, dto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.findOne(id);
    this.assertValidTransition(order.status, dto.status);
    order.status = dto.status;
    await this.orderRepository.save(order);
    return this.findOne(id);
  }

  async cancel(id: number, userId: number): Promise<Order> {
    const order = await this.findOne(id, userId);
    this.assertValidTransition(order.status, 'cancelled');
    order.status = 'cancelled';
    await this.orderRepository.save(order);
    return order;
  }

  private assertValidTransition(current: OrderStatus, next: OrderStatus): void {
    if (!VALID_TRANSITIONS[current].includes(next)) {
      throw new BadRequestException(
        `Transición de estado inválida: ${current} → ${next}`,
      );
    }
  }
}
