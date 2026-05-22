import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Company } from './entities/company.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-user.interface';

describe('CompanyController', () => {
  let controller: CompanyController;
  let service: jest.Mocked<
    Pick<CompanyService, 'create' | 'findAll' | 'findOne' | 'update' | 'remove'>
  >;

  const company: Company = {
    id: 1,
    name: 'Momesso',
    cnpj: '12345678000199',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    users: [],
    machines: [],
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

    controller = new CompanyController(service as CompanyService);
  });

  it('POST /company should create a company', async () => {
    const dto: CreateCompanyDto = { name: company.name, cnpj: company.cnpj };
    service.create.mockResolvedValue(company);

    await expect(controller.create(dto, request)).resolves.toEqual(company);
    expect(service.create).toHaveBeenCalledWith(dto, request.user);
  });

  it('GET /company should list companies', async () => {
    service.findAll.mockResolvedValue([company]);

    await expect(controller.findAll(request)).resolves.toEqual([company]);
    expect(service.findAll).toHaveBeenCalledWith(request.user);
  });

  it('GET /company/:id should return one company', async () => {
    service.findOne.mockResolvedValue(company);

    await expect(controller.findOne(1, request)).resolves.toEqual(company);
    expect(service.findOne).toHaveBeenCalledWith(1, request.user);
  });

  it('PATCH /company/:id should update a company', async () => {
    const dto: UpdateCompanyDto = { name: 'Momesso Atualizada' };
    const updatedCompany = { ...company, ...dto };
    service.update.mockResolvedValue(updatedCompany);

    await expect(controller.update(1, dto, request)).resolves.toEqual(
      updatedCompany,
    );
    expect(service.update).toHaveBeenCalledWith(1, dto, request.user);
  });

  it('DELETE /company/:id should remove a company', async () => {
    service.remove.mockResolvedValue(undefined);

    await expect(controller.remove(1, request)).resolves.toBeUndefined();
    expect(service.remove).toHaveBeenCalledWith(1, request.user);
  });
});
