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
import { SetExternalEnabledDto } from './dto/set-external-enabled.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { StoreProduct } from './entities/store-product.entity';
import { Store } from './entities/store.entity';

export interface StoreCatalogItem extends Product {
  featured: boolean;
  customPitch: string | null;
  externalEnabled: boolean;
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
    // Cadenas vacías en campos opcionales = limpiar (null) en vez de guardar ''.
    const normalized = { ...dto };
    for (const key of [
      'name',
      'tagline',
      'logoUrl',
      'bannerUrl',
    ] as const) {
      if (normalized[key] === '') {
        (normalized as Record<string, unknown>)[key] = null;
      }
    }
    Object.assign(store, normalized);
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
    const entry = await this.storeProductRepository.findOne({
      where: { storeId: store.id, productId },
    });
    if (!entry) {
      throw new NotFoundException(
        `El producto ${productId} no está destacado en tu tienda`,
      );
    }
    // Si el producto tiene activado el botón externo, no borramos la fila:
    // solo dejamos de destacarlo para no perder esa configuración.
    if (entry.externalEnabled) {
      entry.featured = false;
      await this.storeProductRepository.save(entry);
      return;
    }
    await this.storeProductRepository.delete({ id: entry.id });
  }

  /**
   * Activa o desactiva el botón de compra externo para un producto en la
   * tienda del usuario. El enlace/etiqueta son globales (Store.externalUrl);
   * aquí solo se decide qué productos lo muestran. Crea la fila si no existe,
   * sin forzar que el producto quede destacado.
   */
  async setExternalEnabled(
    ownerUserId: number,
    productId: number,
    dto: SetExternalEnabledDto,
  ): Promise<StoreProduct> {
    const store = await this.getMyStore(ownerUserId);

    const product = await this.productRepository.findOne({
      where: { id: productId, deletedAt: IsNull() },
    });
    if (!product) {
      throw new NotFoundException(`Producto ${productId} no encontrado`);
    }

    let entry = await this.storeProductRepository.findOne({
      where: { storeId: store.id, productId },
    });

    if (entry) {
      entry.externalEnabled = dto.enabled;
      // Desactivar el botón en una fila no destacada y sin pitch deja basura:
      // si ya no aporta nada, la eliminamos.
      if (!dto.enabled && !entry.featured && !entry.customPitch) {
        await this.storeProductRepository.delete({ id: entry.id });
        return entry;
      }
    } else {
      entry = this.storeProductRepository.create({
        storeId: store.id,
        productId,
        featured: false,
        sortOrder: 0,
        externalEnabled: dto.enabled,
      });
    }

    return this.storeProductRepository.save(entry);
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
      .addSelect('COALESCE(sp.external_enabled, false)', 'sp_external_enabled')
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
        sp_external_enabled?: boolean | string;
      };
      return Object.assign(product, {
        featured: rawRow.sp_featured === true || rawRow.sp_featured === 'true',
        customPitch: rawRow.sp_custom_pitch ?? null,
        externalEnabled:
          rawRow.sp_external_enabled === true ||
          rawRow.sp_external_enabled === 'true',
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
