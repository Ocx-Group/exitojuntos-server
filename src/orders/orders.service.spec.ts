import { BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  const baseDto = {
    currency: 'USD',
    shippingCost: 5,
    shippingEmail: 'cliente@email.com',
    shippingName: 'Juan Perez',
    shippingAddress: 'Av. Principal 123',
    shippingCity: 'Bogota',
    shippingProvince: 'Cundinamarca',
  };

  function createService(cart: any) {
    const orderRepository = {
      create: jest.fn((order) => order),
      save: jest.fn(async (order) => ({ ...order, id: 10 })),
      findOne: jest.fn(async () => ({
        id: 10,
        userId: 1,
        details: [],
      })),
    };
    const detailRepository = {
      create: jest.fn((detail) => detail),
      save: jest.fn(async (details) => details),
    };
    const cartService = {
      getOrCreateActiveCart: jest.fn(async () => cart),
      abandonCart: jest.fn(async () => undefined),
    };

    const service = new OrdersService(
      orderRepository as any,
      detailRepository as any,
      cartService as any,
    );

    return { service, orderRepository, detailRepository, cartService };
  }

  it('recalcula precios y totales desde el carrito y catálogo', async () => {
    const { service, orderRepository, detailRepository, cartService } =
      createService({
        items: [
          {
            productId: 1,
            quantity: 2,
            unitPrice: 0.01,
            product: {
              price: 100,
              state: true,
              discountPercent: 10,
              taxPercent: 13,
            },
          },
        ],
      });

    await service.createFromCart(
      1,
      {
        ...baseDto,
        subtotal: 0.01,
        taxAmount: 0,
        discountAmount: 0,
        details: [{ productId: 1, quantity: 2, unitPrice: 0.01 }],
      } as unknown as any,
    );

    expect(orderRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        subtotal: 200,
        discountAmount: 20,
        taxAmount: 23.4,
      }),
    );
    expect(detailRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 1,
        quantity: 2,
        unitPrice: 100,
        discountPercent: 10,
        taxPercent: 13,
      }),
    );
    expect(cartService.abandonCart).toHaveBeenCalledWith(1);
  });

  it('rechaza crear una orden sin items en el carrito', async () => {
    const { service, orderRepository, detailRepository } = createService({
      items: [],
    });

    await expect(service.createFromCart(1, baseDto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(orderRepository.save).not.toHaveBeenCalled();
    expect(detailRepository.save).not.toHaveBeenCalled();
  });
});
