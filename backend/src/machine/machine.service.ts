import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../company/entities/company.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';
import { Machine } from './entities/machine.entity';

@Injectable()
export class MachineService {
  constructor(
    @InjectRepository(Machine)
    private readonly machineRepository: Repository<Machine>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async create(
    createMachineDto: CreateMachineDto,
    currentUser?: AuthenticatedUser,
  ): Promise<Machine> {
    this.ensureAdmin(currentUser);
    await this.ensureCompanyExists(createMachineDto.companyId);
    await this.ensureSerialNumberIsAvailable(createMachineDto.serialNumber);

    const machine = this.machineRepository.create(createMachineDto);
    return this.machineRepository.save(machine);
  }

  findAll(currentUser?: AuthenticatedUser): Promise<Machine[]> {
    return this.machineRepository.find({
      where:
        currentUser?.role === UserRole.USER
          ? { companyId: currentUser.companyId }
          : {},
      relations: { company: true },
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number, currentUser?: AuthenticatedUser): Promise<Machine> {
    const machine = await this.machineRepository.findOne({
      where: { id },
      relations: { company: true },
    });

    if (!machine) {
      throw new NotFoundException('Machine not found');
    }

    this.ensureCompanyAccess(machine.companyId, currentUser);
    return machine;
  }

  async update(
    id: number,
    updateMachineDto: UpdateMachineDto,
    currentUser?: AuthenticatedUser,
  ): Promise<Machine> {
    this.ensureAdmin(currentUser);
    const machine = await this.findOne(id, currentUser);

    if (updateMachineDto.companyId) {
      await this.ensureCompanyExists(updateMachineDto.companyId);
    }

    if (
      updateMachineDto.serialNumber &&
      updateMachineDto.serialNumber !== machine.serialNumber
    ) {
      await this.ensureSerialNumberIsAvailable(updateMachineDto.serialNumber);
    }

    Object.assign(machine, updateMachineDto);
    return this.machineRepository.save(machine);
  }

  async remove(id: number, currentUser?: AuthenticatedUser): Promise<void> {
    this.ensureAdmin(currentUser);
    await this.findOne(id, currentUser);

    const result = await this.machineRepository.delete(id);

    if (!result.affected) {
      throw new NotFoundException('Machine not found');
    }
  }

  private async ensureCompanyExists(companyId: number): Promise<void> {
    const exists = await this.companyRepository.exists({
      where: { id: companyId },
    });

    if (!exists) {
      throw new NotFoundException('Company not found');
    }
  }

  private async ensureSerialNumberIsAvailable(
    serialNumber: string,
  ): Promise<void> {
    const exists = await this.machineRepository.exists({
      where: { serialNumber },
    });

    if (exists) {
      throw new ConflictException('Machine serial number already exists');
    }
  }

  private ensureCompanyAccess(
    companyId: number,
    currentUser?: AuthenticatedUser,
  ): void {
    if (
      currentUser?.role === UserRole.USER &&
      currentUser.companyId !== companyId
    ) {
      throw new ForbiddenException('You cannot access this company');
    }
  }

  private ensureAdmin(currentUser?: AuthenticatedUser): void {
    if (currentUser && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admin users can perform this action');
    }
  }
}
