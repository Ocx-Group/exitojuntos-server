import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { NetworkService } from './network.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from './decorators/get-user.decorator';
import { PersonalNetworkQueryDto } from './dto/personal-network-query.dto';

@ApiTags('Red')
@Controller({ path: 'auth', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NetworkController {
  constructor(private readonly networkService: NetworkService) {}

  @Get('unilevel-tree')
  @ApiOperation({
    summary: 'Obtener árbol unilevel del usuario',
    description:
      'Obtiene el árbol genealógico unilevel del usuario. Los usuarios regulares solo pueden ver su propio árbol, mientras que los administradores pueden especificar un userId para ver cualquier árbol.',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: Number,
    description: 'ID del usuario raíz del árbol (solo para administradores)',
    example: 1,
  })
  @ApiQuery({
    name: 'maxLevel',
    required: false,
    type: Number,
    description: 'Nivel máximo de profundidad del árbol (1-20)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Árbol unilevel obtenido exitosamente',
    schema: {
      example: {
        tree: [
          {
            id: 1,
            phone: '573001234567',
            email: 'john@example.com',
            level: 0,
            father: null,
            imageProfileUrl: 'https://example.com/profile.jpg',
          },
          {
            id: 2,
            phone: '573001234568',
            email: 'jane@example.com',
            level: 1,
            father: 1,
            imageProfileUrl: 'https://example.com/profile2.jpg',
          },
        ],
        totalNodes: 2,
        maxLevel: 1,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  getUnilevelTree(
    @GetUser() user: { id: string; phone: string; role: string },
    @Query('userId') userId?: number,
    @Query('maxLevel') maxLevel?: number,
  ) {
    return this.networkService.getUnilevelTree(user, { userId, maxLevel });
  }

  @Get('personal-network')
  @ApiOperation({
    summary: 'Obtener red personal del usuario',
    description:
      'Obtiene todos los usuarios de la red personal del usuario (todos los niveles descendientes). Los usuarios regulares solo pueden ver su propia red, mientras que los administradores pueden especificar un userId para ver cualquier red.',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: Number,
    description: 'ID del usuario raíz de la red (solo para administradores)',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Red personal obtenida exitosamente',
    schema: {
      example: {
        network: [
          {
            id: 2,
            full_name: 'Jane Doe',
            email: 'jane@example.com',
            phone: '573001234568',
            country_name: 'Colombia',
            status: true,
            father: 1,
            latitude: 4.7109886,
            longitude: -74.072092,
            created_at: '2025-11-11T00:00:00.000Z',
            level: 1,
          },
        ],
        totalNodes: 1,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  getPersonalNetwork(
    @GetUser() user: { id: string; phone: string; role: string },
    @Query() query: PersonalNetworkQueryDto,
  ) {
    return this.networkService.getPersonalNetwork(user, query.userId, query);
  }
}
