import { Company } from '../../company/entities/company.entity';
import { UserRole } from '../../common/enums/user-role.enum';
export declare class User {
    id: number;
    name: string;
    email: string;
    password: string;
    role: UserRole;
    company: Company;
    companyId: number;
    createdAt: Date;
}
