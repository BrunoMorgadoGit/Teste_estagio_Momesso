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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const bcrypt = __importStar(require("bcrypt"));
const typeorm_2 = require("typeorm");
const company_entity_1 = require("../company/entities/company.entity");
const user_role_enum_1 = require("../common/enums/user-role.enum");
const user_entity_1 = require("./entities/user.entity");
let UserService = class UserService {
    userRepository;
    companyRepository;
    constructor(userRepository, companyRepository) {
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
    }
    async create(createUserDto, currentUser) {
        this.ensureCompanyAccess(createUserDto.companyId, currentUser);
        await this.ensureCompanyExists(createUserDto.companyId);
        await this.ensureEmailIsAvailable(createUserDto.email);
        const user = this.userRepository.create({
            ...createUserDto,
            password: await bcrypt.hash(createUserDto.password, 10),
        });
        const savedUser = await this.userRepository.save(user);
        return this.removePassword(savedUser);
    }
    async findAll(currentUser) {
        const users = await this.userRepository.find({
            where: currentUser?.role === user_role_enum_1.UserRole.USER
                ? { companyId: currentUser.companyId }
                : {},
            relations: { company: true },
            order: { id: 'ASC' },
        });
        return users.map((user) => this.removePassword(user));
    }
    async findOne(id, currentUser) {
        const user = await this.findEntityById(id);
        this.ensureCompanyAccess(user.companyId, currentUser);
        return this.removePassword(user);
    }
    findByEmail(email) {
        return this.userRepository.findOne({
            where: { email },
            select: {
                id: true,
                name: true,
                email: true,
                password: true,
                role: true,
                companyId: true,
                createdAt: true,
            },
        });
    }
    async update(id, updateUserDto, currentUser) {
        const user = await this.findEntityById(id);
        this.ensureCompanyAccess(user.companyId, currentUser);
        if (updateUserDto.companyId) {
            this.ensureCompanyAccess(updateUserDto.companyId, currentUser);
            await this.ensureCompanyExists(updateUserDto.companyId);
        }
        if (updateUserDto.email && updateUserDto.email !== user.email) {
            await this.ensureEmailIsAvailable(updateUserDto.email);
        }
        const password = updateUserDto.password
            ? await bcrypt.hash(updateUserDto.password, 10)
            : user.password;
        Object.assign(user, { ...updateUserDto, password });
        const savedUser = await this.userRepository.save(user);
        return this.removePassword(savedUser);
    }
    async remove(id, currentUser) {
        const user = await this.findEntityById(id);
        this.ensureCompanyAccess(user.companyId, currentUser);
        const result = await this.userRepository.delete(id);
        if (!result.affected) {
            throw new common_1.NotFoundException('User not found');
        }
    }
    async findEntityById(id) {
        const user = await this.userRepository.findOne({
            where: { id },
            relations: { company: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async ensureCompanyExists(companyId) {
        const exists = await this.companyRepository.exists({
            where: { id: companyId },
        });
        if (!exists) {
            throw new common_1.NotFoundException('Company not found');
        }
    }
    async ensureEmailIsAvailable(email) {
        const exists = await this.userRepository.exists({ where: { email } });
        if (exists) {
            throw new common_1.ConflictException('User email already exists');
        }
    }
    removePassword(user) {
        const { password, ...userWithoutPassword } = user;
        void password;
        return userWithoutPassword;
    }
    ensureCompanyAccess(companyId, currentUser) {
        if (currentUser?.role === user_role_enum_1.UserRole.USER &&
            currentUser.companyId !== companyId) {
            throw new common_1.ForbiddenException('You cannot access this company');
        }
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(company_entity_1.Company)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], UserService);
//# sourceMappingURL=user.service.js.map