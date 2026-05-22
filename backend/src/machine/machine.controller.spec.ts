import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';
import { Machine } from './entities/machine.entity';
import { MachineController } from './machine.controller';
import { MachineService } from './machine.service';
import { UserRole } from '../common/enums/user-role.enum';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-user.interface';

describe('MachineController', () => {
  let controller: MachineController;
  let service: jest.Mocked<
    Pick<MachineService, 'create' | 'findAll' | 'findOne' | 'update' | 'remove'>
  >;

  const machine: Machine = {
    id: 1,
    name: 'Machine 01',
    serialNumber: 'SN-001',
    companyId: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    company: undefined as never,
  };
  const request: AuthenticatedRequest = {
    user: {
      id: 1,
      email: 'admin@momesso.com',
      role: UserRole.ADMIN,
      companyId: 1,
    },
  };

  beforeEach(() => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    controller = new MachineController(service as MachineService);
  });

  it('POST /machine should create a machine', async () => {
    const dto: CreateMachineDto = {
      name: machine.name,
      serialNumber: machine.serialNumber,
      companyId: 1,
    };
    service.create.mockResolvedValue(machine);

    await expect(controller.create(dto, request)).resolves.toEqual(machine);
    expect(service.create).toHaveBeenCalledWith(dto, request.user);
  });

  it('GET /machine should list machines', async () => {
    service.findAll.mockResolvedValue([machine]);

    await expect(controller.findAll(request)).resolves.toEqual([machine]);
    expect(service.findAll).toHaveBeenCalledWith(request.user);
  });

  it('GET /machine/:id should return one machine', async () => {
    service.findOne.mockResolvedValue(machine);

    await expect(controller.findOne(1, request)).resolves.toEqual(machine);
    expect(service.findOne).toHaveBeenCalledWith(1, request.user);
  });

  it('PATCH /machine/:id should update a machine', async () => {
    const dto: UpdateMachineDto = { name: 'Machine Atualizada' };
    const updatedMachine = { ...machine, ...dto };
    service.update.mockResolvedValue(updatedMachine);

    await expect(controller.update(1, dto, request)).resolves.toEqual(
      updatedMachine,
    );
    expect(service.update).toHaveBeenCalledWith(1, dto, request.user);
  });

  it('DELETE /machine/:id should remove a machine', async () => {
    service.remove.mockResolvedValue(undefined);

    await expect(controller.remove(1, request)).resolves.toBeUndefined();
    expect(service.remove).toHaveBeenCalledWith(1, request.user);
  });
});
