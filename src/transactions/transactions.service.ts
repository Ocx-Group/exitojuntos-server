import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import {
  getPagination,
  toPaginatedResult,
} from '../common/utils/pagination.util';
import { OrdersService } from '../orders/orders.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Transaction } from './entities/transaction.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly ordersService: OrdersService,
  ) {}

  async create(dto: CreateTransactionDto): Promise<Transaction> {
    await this.ordersService.findOne(dto.orderId);
    const transaction = this.transactionRepository.create({
      ...dto,
      currency: dto.currency ?? 'USD',
      status: 'pending',
    });
    return this.transactionRepository.save(transaction);
  }

  async findByOrder(
    orderId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Transaction>> {
    const { page, limit, skip } = getPagination(paginationDto);
    const [transactions, total] = await this.transactionRepository.findAndCount(
      {
        where: { orderId },
        order: { createdAt: 'DESC' },
        skip,
        take: limit,
      },
    );

    return toPaginatedResult(transactions, total, page, limit);
  }

  async findOne(id: number): Promise<Transaction> {
    const tx = await this.transactionRepository.findOne({
      where: { id },
      relations: ['order'],
    });
    if (!tx) throw new NotFoundException(`Transacción ${id} no encontrada`);
    return tx;
  }

  /** Última transacción de pago de una orden (la usa el webhook de la pasarela). */
  async findLatestPaymentByOrder(orderId: number): Promise<Transaction | null> {
    return this.transactionRepository.findOne({
      where: { orderId, type: 'payment' },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: number, dto: UpdateTransactionDto): Promise<Transaction> {
    const tx = await this.findOne(id);
    Object.assign(tx, dto);
    if (dto.status === 'approved') tx.processedAt = new Date();
    return this.transactionRepository.save(tx);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Transaction>> {
    const { page, limit, skip } = getPagination(paginationDto);
    const [transactions, total] = await this.transactionRepository.findAndCount(
      {
        relations: ['order'],
        order: { createdAt: 'DESC' },
        skip,
        take: limit,
      },
    );

    return toPaginatedResult(transactions, total, page, limit);
  }
}
