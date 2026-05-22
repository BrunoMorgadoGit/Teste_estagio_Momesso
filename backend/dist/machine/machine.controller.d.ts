import { MachineService } from './machine.service';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-user.interface';
export declare class MachineController {
    private readonly machineService;
    constructor(machineService: MachineService);
    create(createMachineDto: CreateMachineDto, request: AuthenticatedRequest): Promise<import("./entities/machine.entity").Machine>;
    findAll(request: AuthenticatedRequest): Promise<import("./entities/machine.entity").Machine[]>;
    findOne(id: number, request: AuthenticatedRequest): Promise<import("./entities/machine.entity").Machine>;
    update(id: number, updateMachineDto: UpdateMachineDto, request: AuthenticatedRequest): Promise<import("./entities/machine.entity").Machine>;
    remove(id: number, request: AuthenticatedRequest): Promise<void>;
}
