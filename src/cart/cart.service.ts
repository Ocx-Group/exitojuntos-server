import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductsService } from '../products/products.service';
import { StoresService } from '../stores/stores.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartItem } from './entities/cart-item.entity';
import { Cart } from './entities/cart.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    private readonly productsService: ProductsService,
    private readonly storesService: StoresService,
  ) {}

  async getOrCreateActiveCart(userId: number): Promise<Cart> {
    let cart = await this.cartRepository.findOne({
      where: { userId, status: 'active' },
      relations: ['items', 'items.product'],
    });
    if (!cart) {
      cart = this.cartRepository.create({ userId, status: 'active' });
      cart = await this.cartRepository.save(cart);
      cart.items = [];
    }
    return cart;
  }

  async addItem(userId: number, dto: AddCartItemDto): Promise<Cart> {
    const product = await this.productsService.findOne(dto.productId);
    if (!product.state)
      throw new BadRequestException('El producto no está disponible');

    const cart = await this.getOrCreateActiveCart(userId);

    // Atribución: se fija la tienda la primera vez (first-touch) y no se
    // sobrescribe mientras el carrito siga activo.
    if (cart.storeId == null && dto.storeToken) {
      const storeId = await this.storesService.resolveStoreIdByToken(
        dto.storeToken,
      );
      if (storeId != null) {
        cart.storeId = storeId;
        await this.cartRepository.update(cart.id, { storeId });
      }
    }

    const existing = await this.cartItemRepository.findOne({
      where: { cartId: cart.id, productId: dto.productId },
    });

    if (existing) {
      existing.quantity += dto.quantity;
      await this.cartItemRepository.save(existing);
      const cartItem = cart.items.find((item) => item.id === existing.id);
      if (cartItem) cartItem.quantity = existing.quantity;
    } else {
      const item = this.cartItemRepository.create({
        cartId: cart.id,
        productId: dto.productId,
        quantity: dto.quantity,
        unitPrice: product.price,
      });
      const savedItem = await this.cartItemRepository.save(item);
      savedItem.product = product;
      cart.items.push(savedItem);
    }

    return cart;
  }

  async updateItem(
    userId: number,
    itemId: number,
    dto: UpdateCartItemDto,
  ): Promise<Cart> {
    const cart = await this.getOrCreateActiveCart(userId);
    const item = cart.items.find((cartItem) => cartItem.id === itemId);
    if (!item) throw new NotFoundException(`Item ${itemId} no encontrado`);
    item.quantity = dto.quantity;
    await this.cartItemRepository.save(item);
    return cart;
  }

  async removeItem(userId: number, itemId: number): Promise<Cart> {
    const cart = await this.getOrCreateActiveCart(userId);
    const item = cart.items.find((cartItem) => cartItem.id === itemId);
    if (!item) throw new NotFoundException(`Item ${itemId} no encontrado`);
    await this.cartItemRepository.remove(item);
    cart.items = cart.items.filter((cartItem) => cartItem.id !== itemId);
    return cart;
  }

  async clearCart(userId: number): Promise<void> {
    const cart = await this.getOrCreateActiveCart(userId);
    await this.cartItemRepository.delete({ cartId: cart.id });
  }

  async abandonCart(userId: number): Promise<void> {
    const cart = await this.cartRepository.findOne({
      where: { userId, status: 'active' },
    });
    if (cart) {
      cart.status = 'abandoned';
      await this.cartRepository.save(cart);
    }
  }
}
