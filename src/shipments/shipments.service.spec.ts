import { ShipmentsService } from './shipments.service';

describe('ShipmentsService', () => {
  function createService() {
    const shipmentRepository = {
      findOne: jest.fn(async () => ({ id: 5, orderId: 10 })),
    };
    const trackingRepository = {};
    const ordersService = {
      findOne: jest.fn(async () => ({ id: 10, userId: 1 })),
    };

    const service = new ShipmentsService(
      shipmentRepository as any,
      trackingRepository as any,
      ordersService as any,
    );

    return { service, shipmentRepository, ordersService };
  }

  it('valida la propiedad de la orden antes de devolver el envio', async () => {
    const { service, shipmentRepository, ordersService } = createService();

    await service.findByOrder(10, 1);

    expect(ordersService.findOne).toHaveBeenCalledWith(10, 1);
    expect(shipmentRepository.findOne).toHaveBeenCalledWith({
      where: { orderId: 10 },
      relations: ['trackingEvents'],
    });
  });
});
