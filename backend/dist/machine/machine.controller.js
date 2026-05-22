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
exports.MachineController = void 0;
const common_1 = require("@nestjs/common");
const machine_service_1 = require("./machine.service");
const create_machine_dto_1 = require("./dto/create-machine.dto");
const update_machine_dto_1 = require("./dto/update-machine.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let MachineController = class MachineController {
    machineService;
    constructor(machineService) {
        this.machineService = machineService;
    }
    create(createMachineDto, request) {
        return this.machineService.create(createMachineDto, request.user);
    }
    findAll(request) {
        return this.machineService.findAll(request.user);
    }
    findOne(id, request) {
        return this.machineService.findOne(id, request.user);
    }
    update(id, updateMachineDto, request) {
        return this.machineService.update(id, updateMachineDto, request.user);
    }
    remove(id, request) {
        return this.machineService.remove(id, request.user);
    }
};
exports.MachineController = MachineController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_machine_dto_1.CreateMachineDto, Object]),
    __metadata("design:returntype", void 0)
], MachineController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MachineController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], MachineController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_machine_dto_1.UpdateMachineDto, Object]),
    __metadata("design:returntype", void 0)
], MachineController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], MachineController.prototype, "remove", null);
exports.MachineController = MachineController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('machine'),
    __metadata("design:paramtypes", [machine_service_1.MachineService])
], MachineController);
//# sourceMappingURL=machine.controller.js.map