import { BadRequestException } from '@nestjs/common';
import { Order } from './entities/order.entity';
import { OrderDetail } from './entities/order-detail.entity';
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
    const managerCreate = jest.fn((_Entity: any, data: any) => data);
    const managerSave = jest.fn(async (Entity: any, entity: any) =>
      Entity === Order ? { ...entity, id: 10 } : entity,
    );

    const queryRunner = {
      connect: jest.fn(async () => undefined),
      startTransaction: jest.fn(async () => undefined),
      commitTransaction: jest.fn(async () => undefined),
      rollbackTransaction: jest.fn(async () => undefined),
      release: jest.fn(async () => undefined),
      manager: { create: managerCreate, save: managerSave },
    };

    const dataSource = { createQueryRunner: jest.fn(() => queryRunner) };

    const orderRepository = {
      findOne: jest.fn(async () => ({
        id: 10,
        userId: 1,
        details: [],
        user: {},
      })),
    };

    const cartService = {
      getOrCreateActiveCart: jest.fn(async () => cart),
      abandonCart: jest.fn(async () => undefined),
    };

    const storesService = {
      getOwnerUserId: jest.fn(async () => null),
    };

    const service = new OrdersService(
      orderRepository as any,
      {} as any,
      cartService as any,
      storesService as any,
      dataSource as any,
    );

    return { service, queryRunner, managerCreate, managerSave, cartService };
  }

  it('recalcula precios y totales desde el carrito y catálogo', async () => {
    const { service, managerCreate, cartService } = createService({
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

    await service.createFromCart(1, baseDto as any);

    expect(managerCreate).toHaveBeenCalledWith(
      Order,
      expect.objectContaining({
        subtotal: 200,
        discountAmount: 20,
        taxAmount: 23.4,
      }),
    );
    expect(managerCreate).toHaveBeenCalledWith(
      OrderDetail,
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
    const { service, queryRunner } = createService({ items: [] });

    await expect(
      service.createFromCart(1, baseDto as any),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(queryRunner.startTransaction).not.toHaveBeenCalled();
  });
});
