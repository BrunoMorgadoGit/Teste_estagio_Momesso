import { Repository } from 'typeorm';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Company } from './entities/company.entity';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
export declare class CompanyService {
    private readonly companyRepository;
    constructor(companyRepository: Repository<Company>);
    create(createCompanyDto: CreateCompanyDto, currentUser?: AuthenticatedUser): Promise<Company>;
    findAll(currentUser?: AuthenticatedUser): Promise<Company[]>;
    findOne(id: number, currentUser?: AuthenticatedUser): Promise<Company>;
    update(id: number, updateCompanyDto: UpdateCompanyDto, currentUser?: AuthenticatedUser): Promise<Company>;
    remove(id: number, currentUser?: AuthenticatedUser): Promise<void>;
    private removeUserPasswords;
    private ensureAdmin;
    private ensureCompanyAccess;
}
