import { UserRole } from '../common/enums/user-role.enum';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let service: jest.Mocked<Pick<AuthService, 'login'>>;

  beforeEach(() => {
    service = {
      login: jest.fn(),
    };

    controller = new AuthController(service as AuthService);
  });

  it('POST /auth/login should return access token', async () => {
    const dto: LoginDto = {
      email: 'admin@momesso.com',
      password: '123456',
    };
    const response = {
      accessToken: 'jwt-token',
      user: {
        id: 1,
        name: 'Admin',
        email: dto.email,
        role: UserRole.ADMIN,
        companyId: 1,
      },
    };
    service.login.mockResolvedValue(response);

    await expect(controller.login(dto)).resolves.toEqual(response);
    expect(service.login).toHaveBeenCalledWith(dto);
  });

  it('GET /auth/profile should return authenticated request user', () => {
    const request = {
      user: {
        id: 1,
        email: 'admin@momesso.com',
        role: UserRole.ADMIN,
        companyId: 1,
      },
    };

    expect(controller.profile(request)).toEqual(request.user);
  });
});
