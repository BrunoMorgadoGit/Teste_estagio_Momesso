import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { UserRole } from '../../common/enums/user-role.enum';
export interface JwtPayload {
    sub: number;
    email: string;
    role: UserRole;
    companyId: number;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    constructor(config: ConfigService);
    validate(payload: JwtPayload): {
        id: number;
        email: string;
        role: UserRole;
        companyId: number;
    };
}
export {};
