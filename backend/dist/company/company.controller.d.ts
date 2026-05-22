import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-user.interface';
export declare class CompanyController {
    private readonly companyService;
    constructor(companyService: CompanyService);
    create(createCompanyDto: CreateCompanyDto, request: AuthenticatedRequest): Promise<import("./entities/company.entity").Company>;
    findAll(request: AuthenticatedRequest): Promise<import("./entities/company.entity").Company[]>;
    findOne(id: number, request: AuthenticatedRequest): Promise<import("./entities/company.entity").Company>;
    update(id: number, updateCompanyDto: UpdateCompanyDto, request: AuthenticatedRequest): Promise<import("./entities/company.entity").Company>;
    remove(id: number, request: AuthenticatedRequest): Promise<void>;
}
