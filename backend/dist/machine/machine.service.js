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
exports.MachineService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const company_entity_1 = require("../company/entities/company.entity");
const user_role_enum_1 = require("../common/enums/user-role.enum");
const machine_entity_1 = require("./entities/machine.entity");
let MachineService = class MachineService {
    machineRepository;
    companyRepository;
    constructor(machineRepository, companyRepository) {
        this.machineRepository = machineRepository;
        this.companyRepository = companyRepository;
    }
    async create(createMachineDto, currentUser) {
        this.ensureCompanyAccess(createMachineDto.companyId, currentUser);
        await this.ensureCompanyExists(createMachineDto.companyId);
        await this.ensureSerialNumberIsAvailable(createMachineDto.serialNumber);
        const machine = this.machineRepository.create(createMachineDto);
        return this.machineRepository.save(machine);
    }
    findAll(currentUser) {
        return this.machineRepository.find({
            where: currentUser?.role === user_role_enum_1.UserRole.USER
                ? { companyId: currentUser.companyId }
                : {},
            relations: { company: true },
            order: { id: 'ASC' },
        });
    }
    async findOne(id, currentUser) {
        const machine = await this.machineRepository.findOne({
            where: { id },
            relations: { company: true },
        });
        if (!machine) {
            throw new common_1.NotFoundException('Machine not found');
        }
        this.ensureCompanyAccess(machine.companyId, currentUser);
        return machine;
    }
    async update(id, updateMachineDto, currentUser) {
        const machine = await this.findOne(id);
        this.ensureCompanyAccess(machine.companyId, currentUser);
        if (updateMachineDto.companyId) {
            this.ensureCompanyAccess(updateMachineDto.companyId, currentUser);
            await this.ensureCompanyExists(updateMachineDto.companyId);
        }
        if (updateMachineDto.serialNumber &&
            updateMachineDto.serialNumber !== machine.serialNumber) {
            await this.ensureSerialNumberIsAvailable(updateMachineDto.serialNumber);
        }
        Object.assign(machine, updateMachineDto);
        return this.machineRepository.save(machine);
    }
    async remove(id, currentUser) {
        const machine = await this.findOne(id);
        this.ensureCompanyAccess(machine.companyId, currentUser);
        const result = await this.machineRepository.delete(id);
        if (!result.affected) {
            throw new common_1.NotFoundException('Machine not found');
        }
    }
    async ensureCompanyExists(companyId) {
        const exists = await this.companyRepository.exists({
            where: { id: companyId },
        });
        if (!exists) {
            throw new common_1.NotFoundException('Company not found');
        }
    }
    async ensureSerialNumberIsAvailable(serialNumber) {
        const exists = await this.machineRepository.exists({
            where: { serialNumber },
        });
        if (exists) {
            throw new common_1.ConflictException('Machine serial number already exists');
        }
    }
    ensureCompanyAccess(companyId, currentUser) {
        if (currentUser?.role === user_role_enum_1.UserRole.USER &&
            currentUser.companyId !== companyId) {
            throw new common_1.ForbiddenException('You cannot access this company');
        }
    }
};
exports.MachineService = MachineService;
exports.MachineService = MachineService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(machine_entity_1.Machine)),
    __param(1, (0, typeorm_1.InjectRepository)(company_entity_1.Company)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], MachineService);
//# sourceMappingURL=machine.service.js.map