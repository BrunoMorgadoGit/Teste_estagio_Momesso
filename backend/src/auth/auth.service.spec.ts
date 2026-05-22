import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userService: jest.Mocked<Pick<UserService, 'findByEmail'>>;
  let jwtService: jest.Mocked<Pick<JwtService, 'signAsync'>>;

  const user: User = {
    id: 1,
    name: 'Admin',
    email: 'admin@momesso.com',
    password: '$2b$10$hashed',
    role: UserRole.ADMIN,
    companyId: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    company: undefined as never,
  };

  beforeEach(() => {
    userService = {
      findByEmail: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn(),
    };
    service = new AuthService(
      userService as UserService,
      jwtService as JwtService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should validate credentials and sign JWT payload', async () => {
    userService.findByEmail.mockResolvedValue(user);
    jest.mocked(bcrypt.compare).mockResolvedValue(true as never);
    jwtService.signAsync.mockResolvedValue('jwt-token');

    await expect(
      service.login({ email: user.email, password: '123456' }),
    ).resolves.toEqual({
      accessToken: 'jwt-token',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      },
    });

    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    });
  });

  it('should reject when email does not exist', async () => {
    userService.findByEmail.mockResolvedValue(null);

    await expect(
      service.login({ email: 'missing@momesso.com', password: '123456' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should reject when password is invalid', async () => {
    userService.findByEmail.mockResolvedValue(user);
    jest.mocked(bcrypt.compare).mockResolvedValue(false as never);

    await expect(
      service.login({ email: user.email, password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
