import { Machine } from './machine.model';
import { User } from './user.model';

export interface Company {
  id: number;
  name: string;
  cnpj: string;
  createdAt: string;
  users?: User[];
  machines?: Machine[];
}

export interface CreateCompanyRequest {
  name: string;
  cnpj: string;
}

export type UpdateCompanyRequest = Partial<CreateCompanyRequest>;
