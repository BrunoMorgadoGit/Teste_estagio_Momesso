import { Company } from '../../company/entities/company.entity';
export declare class Machine {
    id: number;
    name: string;
    serialNumber: string;
    company: Company;
    companyId: number;
    createdAt: Date;
}
