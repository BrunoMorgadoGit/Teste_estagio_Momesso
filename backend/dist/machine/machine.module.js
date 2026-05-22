"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MachineModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const machine_service_1 = require("./machine.service");
const machine_controller_1 = require("./machine.controller");
const company_entity_1 = require("../company/entities/company.entity");
const machine_entity_1 = require("./entities/machine.entity");
let MachineModule = class MachineModule {
};
exports.MachineModule = MachineModule;
exports.MachineModule = MachineModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([machine_entity_1.Machine, company_entity_1.Company])],
        controllers: [machine_controller_1.MachineController],
        providers: [machine_service_1.MachineService],
    })
], MachineModule);
//# sourceMappingURL=machine.module.js.map