import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-user.interface';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    create(createUserDto: CreateUserDto, request: AuthenticatedRequest): Promise<Omit<import("./entities/user.entity").User, "password">>;
    findAll(request: AuthenticatedRequest): Promise<Omit<import("./entities/user.entity").User, "password">[]>;
    findOne(id: number, request: AuthenticatedRequest): Promise<Omit<import("./entities/user.entity").User, "password">>;
    update(id: number, updateUserDto: UpdateUserDto, request: AuthenticatedRequest): Promise<Omit<import("./entities/user.entity").User, "password">>;
    remove(id: number, request: AuthenticatedRequest): Promise<void>;
}
