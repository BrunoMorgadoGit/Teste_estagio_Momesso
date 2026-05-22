import { Machine } from '../../machine/entities/machine.entity';
import { User } from '../../user/entities/user.entity';
export declare class Company {
    id: number;
    name: string;
    cnpj: string;
    createdAt: Date;
    users: User[];
    machines: Machine[];
}
