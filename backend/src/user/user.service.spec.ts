import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Company } from '../company/entities/company.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from './entities/user.entity';
import { UserService } from './user.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<
    Pick<
      Repository<User>,
      'exists' | 'create' | 'save' | 'find' | 'findOne' | 'delete'
    >
  >;
  let companyRepository: jest.Mocked<Pick<Repository<Company>, 'exists'>>;

  const user: User = {
    id: 1,
    name: 'Admin',
    email: 'admin@momesso.com',
    password: 'hashed-password',
    role: UserRole.ADMIN,
    companyId: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    company: undefined as never,
  };

  beforeEach(() => {
    userRepository = {
      exists: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    };
    companyRepository = {
      exists: jest.fn(),
    };
    service = new UserService(
      userRepository as unknown as Repository<User>,
      companyRepository as unknown as Repository<Company>,
    );
    jest.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should hash password and create user', async () => {
    companyRepository.exists.mockResolvedValue(true);
    userRepository.exists.mockResolvedValue(false);
    userRepository.create.mockReturnValue(user);
    userRepository.save.mockResolvedValue(user);

    const result = await service.create({
      name: user.name,
      email: user.email,
      password: '123456',
      role: UserRole.ADMIN,
      companyId: 1,
    });

    expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10);
    expect(result).not.toHaveProperty('password');
    expect(result.email).toBe(user.email);
  });

  it('should reject create when company does not exist', async () => {
    companyRepository.exists.mockResolvedValue(false);

    await expect(
      service.create({
        name: user.name,
        email: user.email,
        password: '123456',
        role: UserRole.ADMIN,
        companyId: 999,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should reject duplicated email', async () => {
    companyRepository.exists.mockResolvedValue(true);
    userRepository.exists.mockResolvedValue(true);

    await expect(
      service.create({
        name: user.name,
        email: user.email,
        password: '123456',
        role: UserRole.ADMIN,
        companyId: 1,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('should find user by email with password for login', async () => {
    userRepository.findOne.mockResolvedValue(user);

    await expect(service.findByEmail(user.email)).resolves.toEqual(user);
    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: { email: user.email },
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
  });

  it('should remove user when delete affects a row', async () => {
    userRepository.findOne.mockResolvedValue(user);
    userRepository.delete.mockResolvedValue({
      affected: 1,
      raw: [],
    });

    await expect(service.remove(1)).resolves.toBeUndefined();
  });
});
