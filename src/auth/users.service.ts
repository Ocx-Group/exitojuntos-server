import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto, UpdateProfileDto } from './dto';
import { User } from './entities/user.entity';
import { Country } from './entities/country.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Country)
    private readonly countryRepository: Repository<Country>,
  ) {}

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [users, total] = await this.userRepository.findAndCount({
      select: [
        'id',
        'name',
        'lastName',
        'email',
        'username',
        'phone',
        'identification',
        'address',
        'city',
        'state',
        'zipCode',
        'imageProfileUrl',
        'birtDate',
        'father',
        'createdAt',
        'updatedAt',
      ],
      relations: ['role'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByPhone(phone: string) {
    const user = await this.userRepository.findOne({
      where: { phone },
      relations: ['role'],
      select: {
        id: true,
        name: true,
        lastName: true,
        address: true,
        identification: true,
        username: true,
        phone: true,
        email: true,
        city: true,
        state: true,
        imageProfileUrl: true,
        father: true,
        side: true,
        termsConditions: true,
        role: { id: true, name: true },
        birtDate: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({
      where: { id: Number.parseInt(userId) },
      relations: ['role', 'country'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    this.applyProfileUpdates(user, updateProfileDto);

    if (updateProfileDto.countryId !== undefined) {
      const country = await this.countryRepository.findOne({
        where: { id: updateProfileDto.countryId },
      });

      if (!country) {
        throw new NotFoundException('El país especificado no existe');
      }

      user.country = country;
    }

    const updatedUser = await this.userRepository.save(user);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = updatedUser;

    return userWithoutPassword;
  }

  private applyProfileUpdates(user: User, dto: UpdateProfileDto): void {
    const updatableFields: (keyof UpdateProfileDto)[] = [
      'name',
      'lastName',
      'identification',
      'address',
      'city',
      'state',
      'zipCode',
      'imageProfileUrl',
      'birtDate',
      'father',
      'side',
      'status',
      'termsConditions',
    ];

    for (const field of updatableFields) {
      if (dto[field] !== undefined) {
        user[field] = dto[field];
      }
    }
  }
}
