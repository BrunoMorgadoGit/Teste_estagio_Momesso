import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Company } from '../company/entities/company.entity';
import { Machine } from './entities/machine.entity';
import { MachineService } from './machine.service';

describe('MachineService', () => {
  let service: MachineService;
  let machineRepository: jest.Mocked<
    Pick<
      Repository<Machine>,
      'exists' | 'create' | 'save' | 'find' | 'findOne' | 'delete'
    >
  >;
  let companyRepository: jest.Mocked<Pick<Repository<Company>, 'exists'>>;

  const machine: Machine = {
    id: 1,
    name: 'Machine 01',
    serialNumber: 'SN-001',
    companyId: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    company: undefined as never,
  };

  beforeEach(() => {
    machineRepository = {
      exists: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    };
    companyRepository = {
      exists: jest.fn(),
    };
    service = new MachineService(
      machineRepository as unknown as Repository<Machine>,
      companyRepository as unknown as Repository<Company>,
    );
  });

  it('should create machine when company exists and serial is available', async () => {
    companyRepository.exists.mockResolvedValue(true);
    machineRepository.exists.mockResolvedValue(false);
    machineRepository.create.mockReturnValue(machine);
    machineRepository.save.mockResolvedValue(machine);

    await expect(
      service.create({
        name: machine.name,
        serialNumber: machine.serialNumber,
        companyId: 1,
      }),
    ).resolves.toEqual(machine);
  });

  it('should reject create when company does not exist', async () => {
    companyRepository.exists.mockResolvedValue(false);

    await expect(
      service.create({
        name: machine.name,
        serialNumber: machine.serialNumber,
        companyId: 999,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should reject duplicated serial number', async () => {
    companyRepository.exists.mockResolvedValue(true);
    machineRepository.exists.mockResolvedValue(true);

    await expect(
      service.create({
        name: machine.name,
        serialNumber: machine.serialNumber,
        companyId: 1,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('should remove machine when delete affects a row', async () => {
    machineRepository.findOne.mockResolvedValue(machine);
    machineRepository.delete.mockResolvedValue({
      affected: 1,
      raw: [],
    });

    await expect(service.remove(1)).resolves.toBeUndefined();
  });
});
