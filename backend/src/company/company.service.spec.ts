import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CompanyService } from './company.service';
import { Company } from './entities/company.entity';

describe('CompanyService', () => {
  let service: CompanyService;
  let repository: jest.Mocked<
    Pick<
      Repository<Company>,
      'exists' | 'create' | 'save' | 'find' | 'findOne' | 'delete'
    >
  >;

  const company: Company = {
    id: 1,
    name: 'Momesso',
    cnpj: '12345678000199',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    users: [],
    machines: [],
  };

  beforeEach(() => {
    repository = {
      exists: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    };
    service = new CompanyService(repository as unknown as Repository<Company>);
  });

  it('should create company when CNPJ is available', async () => {
    repository.exists.mockResolvedValue(false);
    repository.create.mockReturnValue(company);
    repository.save.mockResolvedValue(company);

    await expect(
      service.create({ name: company.name, cnpj: company.cnpj }),
    ).resolves.toEqual(company);
  });

  it('should reject duplicated CNPJ', async () => {
    repository.exists.mockResolvedValue(true);

    await expect(
      service.create({ name: company.name, cnpj: company.cnpj }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('should throw not found when company does not exist', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('should remove company when delete affects a row', async () => {
    repository.delete.mockResolvedValue({
      affected: 1,
      raw: [],
    });

    await expect(service.remove(1)).resolves.toBeUndefined();
  });
});
