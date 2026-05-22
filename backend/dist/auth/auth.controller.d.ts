import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
interface AuthenticatedRequest {
    user: {
        id: number;
        email: string;
        role: string;
        companyId: number;
    };
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: number;
            name: string;
            email: string;
            role: import("../common/enums/user-role.enum").UserRole;
            companyId: number;
        };
    }>;
    profile(request: AuthenticatedRequest): {
        id: number;
        email: string;
        role: string;
        companyId: number;
    };
}
export {};
