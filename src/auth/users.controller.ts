import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
  Query,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { PaginationDto, UpdateProfileDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { GetUser } from './decorators/get-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { User } from './entities/user.entity';

@ApiTags('Usuarios')
@Controller({ path: 'auth', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil del usuario obtenido exitosamente',
    schema: {
      example: {
        id: '1',
        name: 'John Doe',
        username: 'john.doe',
        phone: '+573001234567',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  getProfile(
    @GetUser()
    user: {
      id: string;
      name: string;
      username: string;
      phone: string;
    },
  ) {
    return user;
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar perfil del usuario autenticado' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: 200, description: 'Perfil actualizado correctamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async updateProfile(
    @GetUser() user: { id: string },
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<Partial<User>> {
    return this.usersService.updateProfile(user.id, updateProfileDto);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener todos los usuarios con paginación' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Cantidad de registros por página',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios obtenida exitosamente',
    schema: {
      example: {
        data: [
          {
            id: 1,
            name: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            username: 'john.doe',
            phone: '+573001234567',
            identification: '1234567890',
            address: 'Calle 123 #45-67',
            city: 'Bogotá',
            state: 'Cundinamarca',
            zipCode: '110111',
            imageProfileUrl: 'https://example.com/profile.jpg',
            birtDate: '1990-01-15T00:00:00.000Z',
            father: null,
            createdAt: '2025-11-11T00:00:00.000Z',
            updatedAt: '2025-11-11T00:00:00.000Z',
            role: { id: 1, name: 'Admin' },
          },
        ],
        meta: { total: 100, page: 1, limit: 10, totalPages: 10 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.usersService.findAll(paginationDto);
  }

  @Get('get_user_phone/:phone')
  @ApiOperation({ summary: 'Buscar usuario por número de teléfono' })
  @ApiResponse({
    status: 200,
    description: 'Usuario encontrado exitosamente',
    schema: {
      example: {
        id: 1,
        name: 'John',
        lastName: 'Doe',
        username: 'john.doe',
        phone: '+573001234567',
        city: 'Bogotá',
        state: 'Cundinamarca',
        imageProfileUrl: 'https://example.com/profile.jpg',
        role: { id: 1, name: 'Admin' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  findByPhone(@Param('phone') phone: string) {
    return this.usersService.findByPhone(phone);
  }

  @Get('get_user_username/:username')
  @ApiOperation({ summary: 'Buscar usuario por nombre de usuario' })
  @ApiResponse({
    status: 200,
    description: 'Usuario encontrado exitosamente',
    schema: {
      example: {
        id: 1,
        name: 'John',
        lastName: 'Doe',
        username: 'john.doe',
        phone: '+573001234567',
        city: 'Bogotá',
        state: 'Cundinamarca',
        imageProfileUrl: 'https://example.com/profile.jpg',
        role: { id: 1, name: 'Admin' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  findByUsername(@Param('username') username: string) {
    return this.usersService.findByUsername(username);
  }
}
