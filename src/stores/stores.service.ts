import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { IsNull, Repository } from 'typeorm';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import {
  getPagination,
  toPaginatedResult,
} from '../common/utils/pagination.util';
import { Product } from '../products/entities/product.entity';
import { FeatureProductDto } from './dto/feature-product.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { StoreProduct } from './entities/store-product.entity';
import { Store } from './entities/store.entity';

export interface StoreCatalogItem extends Product {
  featured: boolean;
  customPitch: string | null;
}

@Injectable()
export class StoresService {
  private readonly logger = new Logger(StoresService.name);

  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(StoreProduct)
    private readonly storeProductRepository: Repository<StoreProduct>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  // ─── Ciclo de vida ───────────────────────────────────────────────

  /**
   * Crea la tienda por defecto del usuario si aún no tiene una.
   * Se invoca al registrar un cliente. Idempotente.
   */
  async createDefaultForUser(
    ownerUserId: number,
    name?: string,
  ): Promise<Store> {
    const existing = await this.storeRepository.findOne({
      where: { ownerUserId, isDefault: true, deletedAt: IsNull() },
    });
    if (existing) return existing;

    const store = this.storeRepository.create({
      ownerUserId,
      publicToken: randomUUID(),
      name: name ?? null,
      status: 'active',
      isDefault: true,
    });
    return this.storeRepository.save(store);
  }

  // ─── Dueño ───────────────────────────────────────────────────────

  async getMyStore(ownerUserId: number): Promise<Store> {
    let store = await this.storeRepository.findOne({
      where: { ownerUserId, isDefault: true, deletedAt: IsNull() },
    });
    // Auto-reparación: usuarios previos al backfill o creados sin tienda
    if (!store) {
      store = await this.createDefaultForUser(ownerUserId);
    }
    return store;
  }

  async updateMyStore(
    ownerUserId: number,
    dto: UpdateStoreDto,
  ): Promise<Store> {
    const store = await this.getMyStore(ownerUserId);
    Object.assign(store, dto);
    return this.storeRepository.save(store);
  }

  async listFeatured(ownerUserId: number): Promise<StoreProduct[]> {
    const store = await this.getMyStore(ownerUserId);
    return this.storeProductRepository.find({
      where: { storeId: store.id },
      relations: ['product'],
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
  }

  async featureProduct(
    ownerUserId: number,
    dto: FeatureProductDto,
  ): Promise<StoreProduct> {
    const store = await this.getMyStore(ownerUserId);

    const product = await this.productRepository.findOne({
      where: { id: dto.productId, deletedAt: IsNull() },
    });
    if (!product) {
      throw new NotFoundException(`Producto ${dto.productId} no encontrado`);
    }

    let entry = await this.storeProductRepository.findOne({
      where: { storeId: store.id, productId: dto.productId },
    });

    if (entry) {
      entry.featured = true;
      entry.sortOrder = dto.sortOrder ?? entry.sortOrder;
      entry.customPitch = dto.customPitch ?? entry.customPitch;
    } else {
      entry = this.storeProductRepository.create({
        storeId: store.id,
        productId: dto.productId,
        featured: true,
        sortOrder: dto.sortOrder ?? 0,
        customPitch: dto.customPitch ?? null,
      });
    }

    return this.storeProductRepository.save(entry);
  }

  async unfeatureProduct(
    ownerUserId: number,
    productId: number,
  ): Promise<void> {
    const store = await this.getMyStore(ownerUserId);
    const result = await this.storeProductRepository.delete({
      storeId: store.id,
      productId,
    });
    if (!result.affected) {
      throw new NotFoundException(
        `El producto ${productId} no está destacado en tu tienda`,
      );
    }
  }

  // ─── Público (por token) ─────────────────────────────────────────

  async findByToken(token: string): Promise<Store> {
    const store = await this.storeRepository.findOne({
      where: { publicToken: token, status: 'active', deletedAt: IsNull() },
    });
    if (!store) {
      throw new NotFoundException('Tienda no encontrada');
    }
    return store;
  }

  /**
   * Catálogo completo del admin visto desde una tienda: los productos
   * destacados por el dueño aparecen primero, marcados con `featured`.
   */
  async getStoreCatalog(
    token: string,
    dto: PaginationDto,
  ): Promise<PaginatedResult<StoreCatalogItem>> {
    const store = await this.findByToken(token);
    const { page, limit, skip } = getPagination(dto);

    const qb = this.productRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'category')
      .leftJoin(
        StoreProduct,
        'sp',
        'sp.product_id = p.id AND sp.store_id = :storeId',
        { storeId: store.id },
      )
      .addSelect('COALESCE(sp.featured, false)', 'sp_featured')
      .addSelect('sp.custom_pitch', 'sp_custom_pitch')
      .where('p.state = :state', { state: true })
      .andWhere('p.deleted_at IS NULL')
      .orderBy('COALESCE(sp.featured, false)', 'DESC')
      .addOrderBy('sp.sort_order', 'ASC')
      .addOrderBy('p.name', 'ASC')
      .offset(skip)
      .limit(limit);

    const { entities, raw } = await qb.getRawAndEntities();

    const data: StoreCatalogItem[] = entities.map((product, index) => {
      const rawRow = raw[index] as {
        sp_featured?: boolean | string;
        sp_custom_pitch?: string | null;
      };
      return Object.assign(product, {
        featured: rawRow.sp_featured === true || rawRow.sp_featured === 'true',
        customPitch: rawRow.sp_custom_pitch ?? null,
      });
    });

    const total = await this.productRepository.count({
      where: { state: true, deletedAt: IsNull() },
    });

    return toPaginatedResult(data, total, page, limit);
  }

  // ─── Helpers de atribución (usados por cart / orders) ────────────

  /** Resuelve el token público a un store_id, o null si no es válido. */
  async resolveStoreIdByToken(token?: string | null): Promise<number | null> {
    if (!token) return null;
    const store = await this.storeRepository.findOne({
      where: { publicToken: token, status: 'active', deletedAt: IsNull() },
      select: { id: true },
    });
    return store?.id ?? null;
  }

  /** Devuelve el dueño de una tienda para el snapshot de la orden. */
  async getOwnerUserId(storeId: number): Promise<number | null> {
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
      select: { id: true, ownerUserId: true },
    });
    return store?.ownerUserId ?? null;
  }
}
