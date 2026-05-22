"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const company_entity_1 = require("./entities/company.entity");
const user_role_enum_1 = require("../common/enums/user-role.enum");
let CompanyService = class CompanyService {
    companyRepository;
    constructor(companyRepository) {
        this.companyRepository = companyRepository;
    }
    async create(createCompanyDto, currentUser) {
        this.ensureAdmin(currentUser);
        const exists = await this.companyRepository.exists({
            where: { cnpj: createCompanyDto.cnpj },
        });
        if (exists) {
            throw new common_1.ConflictException('Company CNPJ already exists');
        }
        const company = this.companyRepository.create(createCompanyDto);
        return this.companyRepository.save(company);
    }
    async findAll(currentUser) {
        const companies = await this.companyRepository.find({
            where: currentUser?.role === user_role_enum_1.UserRole.USER
                ? { id: currentUser.companyId }
                : {},
            relations: { users: true, machines: true },
            order: { id: 'ASC' },
        });
        return companies.map((company) => this.removeUserPasswords(company));
    }
    async findOne(id, currentUser) {
        this.ensureCompanyAccess(id, currentUser);
        const company = await this.companyRepository.findOne({
            where: { id },
            relations: { users: true, machines: true },
        });
        if (!company) {
            throw new common_1.NotFoundException('Company not found');
        }
        return this.removeUserPasswords(company);
    }
    async update(id, updateCompanyDto, currentUser) {
        this.ensureAdmin(currentUser);
        const company = await this.companyRepository.findOne({ where: { id } });
        if (!company) {
            throw new common_1.NotFoundException('Company not found');
        }
        if (updateCompanyDto.cnpj && updateCompanyDto.cnpj !== company.cnpj) {
            const exists = await this.companyRepository.exists({
                where: { cnpj: updateCompanyDto.cnpj },
            });
            if (exists) {
                throw new common_1.ConflictException('Company CNPJ already exists');
            }
        }
        Object.assign(company, updateCompanyDto);
        return this.companyRepository.save(company);
    }
    async remove(id, currentUser) {
        this.ensureAdmin(currentUser);
        const result = await this.companyRepository.delete(id);
        if (!result.affected) {
            throw new common_1.NotFoundException('Company not found');
        }
    }
    removeUserPasswords(company) {
        if (company.users) {
            company.users = company.users.map((user) => {
                const userWithoutPassword = { ...user };
                delete userWithoutPassword.password;
                return userWithoutPassword;
            });
        }
        return company;
    }
    ensureAdmin(currentUser) {
        if (currentUser && currentUser.role !== user_role_enum_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Only admin users can perform this action');
        }
    }
    ensureCompanyAccess(companyId, currentUser) {
        if (currentUser?.role === user_role_enum_1.UserRole.USER &&
            currentUser.companyId !== companyId) {
            throw new common_1.ForbiddenException('You cannot access this company');
        }
    }
};
exports.CompanyService = CompanyService;
exports.CompanyService = CompanyService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(company_entity_1.Company)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CompanyService);
//# sourceMappingURL=company.service.js.map