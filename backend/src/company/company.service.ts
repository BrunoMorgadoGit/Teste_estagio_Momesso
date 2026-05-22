import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Company } from './entities/company.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async create(
    createCompanyDto: CreateCompanyDto,
    currentUser?: AuthenticatedUser,
  ): Promise<Company> {
    this.ensureAdmin(currentUser);

    const exists = await this.companyRepository.exists({
      where: { cnpj: createCompanyDto.cnpj },
    });

    if (exists) {
      throw new ConflictException('Company CNPJ already exists');
    }

    const company = this.companyRepository.create(createCompanyDto);
    return this.companyRepository.save(company);
  }

  async findAll(currentUser?: AuthenticatedUser): Promise<Company[]> {
    const companies = await this.companyRepository.find({
      where:
        currentUser?.role === UserRole.USER
          ? { id: currentUser.companyId }
          : {},
      relations: { users: true, machines: true },
      order: { id: 'ASC' },
    });

    return companies.map((company) => this.removeUserPasswords(company));
  }

  async findOne(id: number, currentUser?: AuthenticatedUser): Promise<Company> {
    this.ensureCompanyAccess(id, currentUser);

    const company = await this.companyRepository.findOne({
      where: { id },
      relations: { users: true, machines: true },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return this.removeUserPasswords(company);
  }

  async update(
    id: number,
    updateCompanyDto: UpdateCompanyDto,
    currentUser?: AuthenticatedUser,
  ): Promise<Company> {
    this.ensureAdmin(currentUser);

    const company = await this.companyRepository.findOne({ where: { id } });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (updateCompanyDto.cnpj && updateCompanyDto.cnpj !== company.cnpj) {
      const exists = await this.companyRepository.exists({
        where: { cnpj: updateCompanyDto.cnpj },
      });

      if (exists) {
        throw new ConflictException('Company CNPJ already exists');
      }
    }

    Object.assign(company, updateCompanyDto);
    return this.companyRepository.save(company);
  }

  async remove(id: number, currentUser?: AuthenticatedUser): Promise<void> {
    this.ensureAdmin(currentUser);

    const result = await this.companyRepository.delete(id);

    if (!result.affected) {
      throw new NotFoundException('Company not found');
    }
  }

  private removeUserPasswords(company: Company): Company {
    if (company.users) {
      company.users = company.users.map((user) => {
        const userWithoutPassword = { ...user };
        delete (userWithoutPassword as Partial<{ password: string }>).password;
        return userWithoutPassword;
      });
    }

    return company;
  }

  private ensureAdmin(currentUser?: AuthenticatedUser): void {
    if (currentUser && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admin users can perform this action');
    }
  }

  private ensureCompanyAccess(
    companyId: number,
    currentUser?: AuthenticatedUser,
  ): void {
    if (
      currentUser?.role === UserRole.USER &&
      currentUser.companyId !== companyId
    ) {
      throw new ForbiddenException('You cannot access this company');
    }
  }
}
