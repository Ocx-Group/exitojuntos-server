import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Roles')
@Controller({ path: 'roles', version: 'v1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin')
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo rol' })
  @ApiBody({ type: CreateRoleDto })
  @ApiResponse({
    status: 201,
    description: 'Rol creado exitosamente',
    schema: {
      example: {
        id: 1,
        name: 'Admin',
        createdAt: '2025-11-11T00:00:00.000Z',
        updatedAt: '2025-11-11T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'El rol ya existe',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los roles' })
  @ApiResponse({
    status: 200,
    description: 'Lista de roles obtenida exitosamente',
    schema: {
      example: [
        {
          id: 1,
          name: 'Admin',
          createdAt: '2025-11-11T00:00:00.000Z',
          updatedAt: '2025-11-11T00:00:00.000Z',
          users: [],
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.rolesService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un rol por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID del rol',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Rol obtenido exitosamente',
    schema: {
      example: {
        id: 1,
        name: 'Admin',
        createdAt: '2025-11-11T00:00:00.000Z',
        updatedAt: '2025-11-11T00:00:00.000Z',
        users: [],
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Rol no encontrado',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un rol' })
  @ApiParam({
    name: 'id',
    description: 'ID del rol',
    type: Number,
  })
  @ApiBody({ type: UpdateRoleDto })
  @ApiResponse({
    status: 200,
    description: 'Rol actualizado exitosamente',
    schema: {
      example: {
        id: 1,
        name: 'SuperAdmin',
        createdAt: '2025-11-11T00:00:00.000Z',
        updatedAt: '2025-11-11T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Rol no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'El nombre del rol ya existe',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un rol' })
  @ApiParam({
    name: 'id',
    description: 'ID del rol',
    type: Number,
  })
  @ApiResponse({
    status: 204,
    description: 'Rol eliminado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Rol no encontrado',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.remove(id);
  }
}
