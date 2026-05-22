import { Repository } from 'typeorm';
import { Company } from '../company/entities/company.entity';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
export declare class UserService {
    private readonly userRepository;
    private readonly companyRepository;
    constructor(userRepository: Repository<User>, companyRepository: Repository<Company>);
    create(createUserDto: CreateUserDto, currentUser?: AuthenticatedUser): Promise<Omit<User, 'password'>>;
    findAll(currentUser?: AuthenticatedUser): Promise<Omit<User, 'password'>[]>;
    findOne(id: number, currentUser?: AuthenticatedUser): Promise<Omit<User, 'password'>>;
    findByEmail(email: string): Promise<User | null>;
    update(id: number, updateUserDto: UpdateUserDto, currentUser?: AuthenticatedUser): Promise<Omit<User, 'password'>>;
    remove(id: number, currentUser?: AuthenticatedUser): Promise<void>;
    private findEntityById;
    private ensureCompanyExists;
    private ensureEmailIsAvailable;
    private removePassword;
    private ensureCompanyAccess;
}
