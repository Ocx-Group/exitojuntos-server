import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../auth/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { FeatureProductDto } from './dto/feature-product.dto';
import { SetExternalEnabledDto } from './dto/set-external-enabled.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { StoresService } from './stores.service';

@ApiTags('Tiendas')
@Controller({ path: 'stores', version: '1' })
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  // ─── Mi tienda (dueño autenticado) ───────────────────────────────

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener mi tienda' })
  getMyStore(@GetUser() user: User) {
    return this.storesService.getMyStore(user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar branding/estado de mi tienda' })
  updateMyStore(@GetUser() user: User, @Body() dto: UpdateStoreDto) {
    return this.storesService.updateMyStore(user.id, dto);
  }

  @Get('me/products')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar productos destacados en mi tienda' })
  listFeatured(@GetUser() user: User) {
    return this.storesService.listFeatured(user.id);
  }

  @Post('me/products')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Destacar/promocionar un producto en mi tienda' })
  featureProduct(@GetUser() user: User, @Body() dto: FeatureProductDto) {
    return this.storesService.featureProduct(user.id, dto);
  }

  @Patch('me/products/:productId/external')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Activar/desactivar el botón externo en un producto',
  })
  setExternalEnabled(
    @GetUser() user: User,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: SetExternalEnabledDto,
  ) {
    return this.storesService.setExternalEnabled(user.id, productId, dto);
  }

  @Delete('me/products/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Quitar un producto destacado de mi tienda' })
  unfeatureProduct(
    @GetUser() user: User,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.storesService.unfeatureProduct(user.id, productId);
  }

  // ─── Escaparate público (por token) ──────────────────────────────

  @Get('t/:token')
  @ApiOperation({ summary: 'Ver una tienda por su enlace público' })
  findByToken(@Param('token') token: string) {
    return this.storesService.findByToken(token);
  }

  @Get('t/:token/products')
  @ApiOperation({ summary: 'Catálogo de una tienda (destacados primero)' })
  getStoreCatalog(
    @Param('token') token: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.storesService.getStoreCatalog(token, paginationDto);
  }
}
