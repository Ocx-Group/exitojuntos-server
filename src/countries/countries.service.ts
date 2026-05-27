import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Country } from '../auth/entities/country.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { getPagination, toPaginatedResult } from '../common/utils/pagination.util';

@Injectable()
export class CountriesService {
  constructor(
    @InjectRepository(Country)
    private readonly countryRepository: Repository<Country>,
  ) {}

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Country>> {
    const { page, limit, skip } = getPagination(paginationDto);
    const [countries, total] = await this.countryRepository.findAndCount({
      order: { name: 'ASC' },
      skip,
      take: limit,
    });

    return toPaginatedResult(countries, total, page, limit);
  }
}
