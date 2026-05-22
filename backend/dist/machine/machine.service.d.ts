import { Repository } from 'typeorm';
import { Company } from '../company/entities/company.entity';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';
import { Machine } from './entities/machine.entity';
export declare class MachineService {
    private readonly machineRepository;
    private readonly companyRepository;
    constructor(machineRepository: Repository<Machine>, companyRepository: Repository<Company>);
    create(createMachineDto: CreateMachineDto, currentUser?: AuthenticatedUser): Promise<Machine>;
    findAll(currentUser?: AuthenticatedUser): Promise<Machine[]>;
    findOne(id: number, currentUser?: AuthenticatedUser): Promise<Machine>;
    update(id: number, updateMachineDto: UpdateMachineDto, currentUser?: AuthenticatedUser): Promise<Machine>;
    remove(id: number, currentUser?: AuthenticatedUser): Promise<void>;
    private ensureCompanyExists;
    private ensureSerialNumberIsAvailable;
    private ensureCompanyAccess;
}
