import { PaginationDto } from '../dto/pagination.dto';
import { PaginatedResult } from '../interfaces/paginated-result.interface';

export function getPagination(paginationDto: PaginationDto = {}) {
  const page = Math.max(1, Number(paginationDto.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(paginationDto.limit ?? 10)));

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

export function toPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
