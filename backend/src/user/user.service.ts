import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Company } from '../company/entities/company.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async create(
    createUserDto: CreateUserDto,
    currentUser?: AuthenticatedUser,
  ): Promise<Omit<User, 'password'>> {
    this.ensureAdmin(currentUser);
    await this.ensureCompanyExists(createUserDto.companyId);
    await this.ensureEmailIsAvailable(createUserDto.email);

    const user = this.userRepository.create({
      ...createUserDto,
      password: await bcrypt.hash(createUserDto.password, 10),
    });

    const savedUser = await this.userRepository.save(user);
    return this.removePassword(savedUser);
  }

  async findAll(
    currentUser?: AuthenticatedUser,
  ): Promise<Omit<User, 'password'>[]> {
    const users = await this.userRepository.find({
      where:
        currentUser?.role === UserRole.USER
          ? { companyId: currentUser.companyId }
          : {},
      relations: { company: true },
      order: { id: 'ASC' },
    });

    return users.map((user) => this.removePassword(user));
  }

  async findOne(
    id: number,
    currentUser?: AuthenticatedUser,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.findEntityById(id);
    this.ensureCompanyAccess(user.companyId, currentUser);
    return this.removePassword(user);
  }

  findByEmail(email: string): Promise<User | null> {
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

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    currentUser?: AuthenticatedUser,
  ): Promise<Omit<User, 'password'>> {
    this.ensureAdmin(currentUser);
    const user = await this.findEntityById(id);

    if (updateUserDto.companyId) {
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

  async remove(id: number, currentUser?: AuthenticatedUser): Promise<void> {
    this.ensureAdmin(currentUser);
    await this.findEntityById(id);

    const result = await this.userRepository.delete(id);

    if (!result.affected) {
      throw new NotFoundException('User not found');
    }
  }

  private async findEntityById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: { company: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async ensureCompanyExists(companyId: number): Promise<void> {
    const exists = await this.companyRepository.exists({
      where: { id: companyId },
    });

    if (!exists) {
      throw new NotFoundException('Company not found');
    }
  }

  private async ensureEmailIsAvailable(email: string): Promise<void> {
    const exists = await this.userRepository.exists({ where: { email } });

    if (exists) {
      throw new ConflictException('User email already exists');
    }
  }

  private removePassword(user: User): Omit<User, 'password'> {
    const { password, ...userWithoutPassword } = user;
    void password;
    return userWithoutPassword;
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
