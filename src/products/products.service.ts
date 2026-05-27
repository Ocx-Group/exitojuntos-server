import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { getPagination, toPaginatedResult } from '../common/utils/pagination.util';
import { ProductCategory } from './entities/product-category.entity';
import { Product } from './entities/product.entity';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductCategory)
    private readonly categoryRepository: Repository<ProductCategory>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  // ─── Categories ──────────────────────────────────────────────────

  async findAllCategories(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<ProductCategory>> {
    const { page, limit, skip } = getPagination(paginationDto);
    const [categories, total] = await this.categoryRepository.findAndCount({
      where: { deletedAt: IsNull() },
      order: { name: 'ASC' },
      skip,
      take: limit,
    });

    return toPaginatedResult(categories, total, page, limit);
  }

  async findOneCategory(id: number): Promise<ProductCategory> {
    const category = await this.categoryRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!category) throw new NotFoundException(`Categoría ${id} no encontrada`);
    return category;
  }

  async createCategory(
    dto: CreateProductCategoryDto,
  ): Promise<ProductCategory> {
    const category = this.categoryRepository.create(dto);
    return this.categoryRepository.save(category);
  }

  async updateCategory(
    id: number,
    dto: UpdateProductCategoryDto,
  ): Promise<ProductCategory> {
    const category = await this.findOneCategory(id);
    Object.assign(category, dto);
    return this.categoryRepository.save(category);
  }

  async removeCategory(id: number): Promise<void> {
    const category = await this.findOneCategory(id);
    await this.categoryRepository.softRemove(category);
  }

  // ─── Products ────────────────────────────────────────────────────

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Product>> {
    const { page, limit, skip } = getPagination(paginationDto);
    const [products, total] = await this.productRepository.findAndCount({
      where: { deletedAt: IsNull() },
      relations: ['category'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return toPaginatedResult(products, total, page, limit);
  }

  async findActive(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Product>> {
    const { page, limit, skip } = getPagination(paginationDto);
    const [products, total] = await this.productRepository.findAndCount({
      where: { state: true, deletedAt: IsNull() },
      relations: ['category'],
      order: { name: 'ASC' },
      skip,
      take: limit,
    });

    return toPaginatedResult(products, total, page, limit);
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['category'],
    });
    if (!product) throw new NotFoundException(`Producto ${id} no encontrado`);
    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    await this.findOneCategory(dto.productCategoryId);
    const product = this.productRepository.create(dto);
    return this.productRepository.save(product);
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    if (dto.productCategoryId)
      await this.findOneCategory(dto.productCategoryId);
    Object.assign(product, dto);
    return this.productRepository.save(product);
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.softRemove(product);
  }
}
