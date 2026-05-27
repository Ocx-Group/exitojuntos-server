import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { getPagination, toPaginatedResult } from '../common/utils/pagination.util';
import { Role } from '../auth/entities/role.entity';
import { CreateRoleDto, UpdateRoleDto } from './dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const { name } = createRoleDto;

    // Verificar si el rol ya existe
    const existingRole = await this.roleRepository.findOne({
      where: { name },
    });

    if (existingRole) {
      throw new ConflictException('El rol ya existe');
    }

    const newRole = this.roleRepository.create({ name });
    return await this.roleRepository.save(newRole);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Role>> {
    const { page, limit, skip } = getPagination(paginationDto);
    const [roles, total] = await this.roleRepository.findAndCount({
      relations: ['users'],
      skip,
      take: limit,
    });

    return toPaginatedResult(roles, total, page, limit);
  }

  async findOne(id: number): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!role) {
      throw new NotFoundException(`Rol con ID ${id} no encontrado`);
    }

    return role;
  }

  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);

    if (updateRoleDto.name) {
      // Verificar si el nuevo nombre ya existe en otro rol
      const existingRole = await this.roleRepository.findOne({
        where: { name: updateRoleDto.name },
      });

      if (existingRole && existingRole.id !== id) {
        throw new ConflictException('El nombre del rol ya existe');
      }

      role.name = updateRoleDto.name;
    }

    return await this.roleRepository.save(role);
  }

  async remove(id: number): Promise<void> {
    const role = await this.findOne(id);
    await this.roleRepository.softRemove(role);
  }
}
