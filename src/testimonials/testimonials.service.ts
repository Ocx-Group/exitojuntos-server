import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { getPagination, toPaginatedResult } from '../common/utils/pagination.util';
import { CreateTestimonialDto, UpdateTestimonialDto } from './dto';
import { Testimonial } from './testimonial.entity';

@Injectable()
export class TestimonialsService {
  constructor(
    @InjectRepository(Testimonial)
    private readonly testimonialRepository: Repository<Testimonial>,
  ) {}

  async findActive(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Testimonial>> {
    const { page, limit, skip } = getPagination(paginationDto);
    const [testimonials, total] = await this.testimonialRepository.findAndCount({
      where: { isActive: true, deletedAt: IsNull() },
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return toPaginatedResult(testimonials, total, page, limit);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Testimonial>> {
    const { page, limit, skip } = getPagination(paginationDto);
    const [testimonials, total] = await this.testimonialRepository.findAndCount({
      withDeleted: false,
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return toPaginatedResult(testimonials, total, page, limit);
  }

  async create(dto: CreateTestimonialDto): Promise<Testimonial> {
    const testimonial = this.testimonialRepository.create({
      ...dto,
      avatar:
        this.normalizeOptionalText(dto.avatar) || 'assets/images/user.png',
      videoUrl: this.normalizeOptionalText(dto.videoUrl),
      stars: dto.stars ?? 5,
      displayOrder: dto.displayOrder ?? 0,
      isActive: dto.isActive ?? true,
    });

    return this.testimonialRepository.save(testimonial);
  }

  async update(id: number, dto: UpdateTestimonialDto): Promise<Testimonial> {
    const testimonial = await this.testimonialRepository.findOne({
      where: { id },
    });

    if (!testimonial) {
      throw new NotFoundException('Testimonio no encontrado');
    }

    Object.assign(testimonial, {
      ...dto,
      avatar:
        dto.avatar === undefined
          ? testimonial.avatar
          : this.normalizeOptionalText(dto.avatar) || 'assets/images/user.png',
      videoUrl:
        dto.videoUrl === undefined
          ? testimonial.videoUrl
          : this.normalizeOptionalText(dto.videoUrl),
    });

    return this.testimonialRepository.save(testimonial);
  }

  async remove(id: number): Promise<{ message: string }> {
    const testimonial = await this.testimonialRepository.findOne({
      where: { id },
    });

    if (!testimonial) {
      throw new NotFoundException('Testimonio no encontrado');
    }

    await this.testimonialRepository.softRemove(testimonial);
    return { message: 'Testimonio eliminado correctamente' };
  }

  private normalizeOptionalText(value?: string): string | null {
    const normalized = value?.trim();
    return normalized || null;
  }
}
