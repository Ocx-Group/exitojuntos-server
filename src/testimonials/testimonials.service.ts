import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CreateTestimonialDto, UpdateTestimonialDto } from './dto';
import { Testimonial } from './testimonial.entity';

@Injectable()
export class TestimonialsService {
  constructor(
    @InjectRepository(Testimonial)
    private readonly testimonialRepository: Repository<Testimonial>,
  ) {}

  findActive(): Promise<Testimonial[]> {
    return this.testimonialRepository.find({
      where: { isActive: true, deletedAt: IsNull() },
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  findAll(): Promise<Testimonial[]> {
    return this.testimonialRepository.find({
      withDeleted: false,
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
    });
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
