"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const typeorm_1 = require("@nestjs/typeorm");
const bcrypt = __importStar(require("bcrypt"));
const app_module_1 = require("../app.module");
const company_entity_1 = require("../company/entities/company.entity");
const user_role_enum_1 = require("../common/enums/user-role.enum");
const machine_entity_1 = require("../machine/entities/machine.entity");
const user_entity_1 = require("../user/entities/user.entity");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const companyRepository = app.get((0, typeorm_1.getRepositoryToken)(company_entity_1.Company));
    const userRepository = app.get((0, typeorm_1.getRepositoryToken)(user_entity_1.User));
    const machineRepository = app.get((0, typeorm_1.getRepositoryToken)(machine_entity_1.Machine));
    let company = await companyRepository.findOne({
        where: { cnpj: '00000000000191' },
    });
    if (company) {
        company.name = 'Momesso Seed Company';
        company = await companyRepository.save(company);
    }
    else {
        company = await companyRepository.save(companyRepository.create({
            name: 'Momesso Seed Company',
            cnpj: '00000000000191',
        }));
    }
    const adminPassword = await bcrypt.hash('Admin@123', 10);
    const userPassword = await bcrypt.hash('User@123', 10);
    const admin = await userRepository.findOne({
        where: { email: 'admin@momesso.com' },
        select: { id: true },
    });
    if (admin) {
        await userRepository.update(admin.id, {
            name: 'Admin Momesso',
            password: adminPassword,
            role: user_role_enum_1.UserRole.ADMIN,
            companyId: company.id,
        });
    }
    else {
        await userRepository.save(userRepository.create({
            name: 'Admin Momesso',
            email: 'admin@momesso.com',
            password: adminPassword,
            role: user_role_enum_1.UserRole.ADMIN,
            companyId: company.id,
        }));
    }
    const user = await userRepository.findOne({
        where: { email: 'user@momesso.com' },
        select: { id: true },
    });
    if (user) {
        await userRepository.update(user.id, {
            name: 'User Momesso',
            password: userPassword,
            role: user_role_enum_1.UserRole.USER,
            companyId: company.id,
        });
    }
    else {
        await userRepository.save(userRepository.create({
            name: 'User Momesso',
            email: 'user@momesso.com',
            password: userPassword,
            role: user_role_enum_1.UserRole.USER,
            companyId: company.id,
        }));
    }
    const machine = await machineRepository.findOne({
        where: { serialNumber: 'SEED-MACHINE-001' },
    });
    if (machine) {
        await machineRepository.update(machine.id, {
            name: 'Seed Machine',
            companyId: company.id,
        });
    }
    else {
        await machineRepository.save(machineRepository.create({
            name: 'Seed Machine',
            serialNumber: 'SEED-MACHINE-001',
            companyId: company.id,
        }));
    }
    await app.close();
}
void bootstrap();
//# sourceMappingURL=seed.js.map