import { UserRole } from './user.model';

export interface LoginResponse {
  access_token?: string;
  accessToken?: string;
  token?: string;
  user?: AuthenticatedUser;
}

export interface AuthenticatedUser {
  id?: number;
  sub?: number;
  email: string;
  role: UserRole;
  companyId: number;
  exp?: number;
  iat?: number;
}
