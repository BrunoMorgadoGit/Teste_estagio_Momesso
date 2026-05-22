"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateMachineDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_machine_dto_1 = require("./create-machine.dto");
class UpdateMachineDto extends (0, mapped_types_1.PartialType)(create_machine_dto_1.CreateMachineDto) {
}
exports.UpdateMachineDto = UpdateMachineDto;
//# sourceMappingURL=update-machine.dto.js.map