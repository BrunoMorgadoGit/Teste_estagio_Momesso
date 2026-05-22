import { UserRole } from '../common/enums/user-role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-user.interface';

interface UserResponse {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  companyId: number;
  createdAt: Date;
}

describe('UserController', () => {
  let controller: UserController;
  let service: jest.Mocked<
    Pick<UserService, 'create' | 'findAll' | 'findOne' | 'update' | 'remove'>
  >;

  const user: UserResponse = {
    id: 1,
    name: 'Admin',
    email: 'admin@momesso.com',
    role: UserRole.ADMIN,
    companyId: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };
  const request: AuthenticatedRequest = {
    user: {
      id: 1,
      email: 'admin@momesso.com',
      role: UserRole.ADMIN,
      companyId: 1,
    },
  };

  beforeEach(() => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    controller = new UserController(service as UserService);
  });

  it('POST /user should create a user without returning password', async () => {
    const dto: CreateUserDto = {
      name: user.name,
      email: user.email,
      password: '123456',
      role: UserRole.ADMIN,
      companyId: 1,
    };
    service.create.mockResolvedValue(user);

    await expect(controller.create(dto, request)).resolves.toEqual(user);
    expect(service.create).toHaveBeenCalledWith(dto, request.user);
  });

  it('GET /user should list users', async () => {
    service.findAll.mockResolvedValue([user]);

    await expect(controller.findAll(request)).resolves.toEqual([user]);
    expect(service.findAll).toHaveBeenCalledWith(request.user);
  });

  it('GET /user/:id should return one user', async () => {
    service.findOne.mockResolvedValue(user);

    await expect(controller.findOne(1, request)).resolves.toEqual(user);
    expect(service.findOne).toHaveBeenCalledWith(1, request.user);
  });

  it('PATCH /user/:id should update a user', async () => {
    const dto: UpdateUserDto = { name: 'Admin Atualizado' };
    const updatedUser = { ...user, ...dto };
    service.update.mockResolvedValue(updatedUser);

    await expect(controller.update(1, dto, request)).resolves.toEqual(
      updatedUser,
    );
    expect(service.update).toHaveBeenCalledWith(1, dto, request.user);
  });

  it('DELETE /user/:id should remove a user', async () => {
    service.remove.mockResolvedValue(undefined);

    await expect(controller.remove(1, request)).resolves.toBeUndefined();
    expect(service.remove).toHaveBeenCalledWith(1, request.user);
  });
});
