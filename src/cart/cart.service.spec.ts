import { CartService } from './cart.service';

describe('CartService', () => {
  function createService() {
    const cart = {
      id: 10,
      userId: 1,
      status: 'active',
      items: [
        {
          id: 5,
          cartId: 10,
          productId: 20,
          quantity: 1,
          unitPrice: 100,
          product: { id: 20, price: 100, state: true },
        },
      ],
    };
    const cartRepository = {
      findOne: jest.fn(async () => cart),
      create: jest.fn((data) => data),
      save: jest.fn(async (data) => data),
    };
    const cartItemRepository = {
      findOne: jest.fn(),
      save: jest.fn(async (data) => data),
      remove: jest.fn(async (data) => data),
    };
    const productsService = {
      findOne: jest.fn(),
    };

    const service = new CartService(
      cartRepository as any,
      cartItemRepository as any,
      productsService as any,
    );

    return { service, cartRepository, cartItemRepository };
  }

  it('actualiza items sin recargar el carrito ni consultar el item aparte', async () => {
    const { service, cartRepository, cartItemRepository } = createService();

    const cart = await service.updateItem(1, 5, { quantity: 3 });

    expect(cartRepository.findOne).toHaveBeenCalledTimes(1);
    expect(cartItemRepository.findOne).not.toHaveBeenCalled();
    expect(cartItemRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 5, quantity: 3 }),
    );
    expect(cart.items[0].quantity).toBe(3);
  });
});
