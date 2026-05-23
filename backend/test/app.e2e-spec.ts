import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { UserRole } from '../src/common/enums/user-role.enum';
import { Company } from '../src/company/entities/company.entity';
import { Machine } from '../src/machine/entities/machine.entity';
import { User } from '../src/user/entities/user.entity';

interface CompanyResponse {
  id: number;
  name: string;
  cnpj: string;
  users?: Array<{ password?: string }>;
}

interface UserResponse {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  companyId: number;
  password?: string;
}

interface MachineResponse {
  id: number;
  name: string;
  serialNumber: string;
  companyId: number;
}

interface AuthResponse {
  accessToken: string;
  user: UserResponse;
}

interface ProfileResponse {
  id: number;
  email: string;
  role: UserRole;
  companyId: number;
}

describe('Backend API (e2e)', () => {
  let app: INestApplication<App>;
  let companyRepository: Repository<Company>;
  let userRepository: Repository<User>;
  let machineRepository: Repository<Machine>;
  const suffix = `${Date.now()}`;
  const cnpj = suffix.slice(-14).padStart(14, '0');
  const seedEmail = `seed-${suffix}@momesso.com`;
  const seedUserEmail = `seed-user-${suffix}@momesso.com`;
  const seedPassword = '123456';
  let seedCompanyId: number;
  let seedUserId: number;
  let seedRegularUserId: number;
  let seedMachineId: number;
  let companyId: number;
  let userId: number;
  let machineId: number;
  let accessToken: string;
  let userAccessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    companyRepository = app.get<Repository<Company>>(
      getRepositoryToken(Company),
    );
    userRepository = app.get<Repository<User>>(getRepositoryToken(User));
    machineRepository = app.get<Repository<Machine>>(
      getRepositoryToken(Machine),
    );

    const seedCompany = await companyRepository.save(
      companyRepository.create({
        name: `Seed Company ${suffix}`,
        cnpj: `seed-${suffix}`,
      }),
    );
    seedCompanyId = seedCompany.id;

    const seedUser = await userRepository.save(
      userRepository.create({
        name: `Seed Admin ${suffix}`,
        email: seedEmail,
        password: await bcrypt.hash(seedPassword, 10),
        role: UserRole.ADMIN,
        companyId: seedCompanyId,
      }),
    );
    seedUserId = seedUser.id;

    const seedRegularUser = await userRepository.save(
      userRepository.create({
        name: `Seed User ${suffix}`,
        email: seedUserEmail,
        password: await bcrypt.hash(seedPassword, 10),
        role: UserRole.USER,
        companyId: seedCompanyId,
      }),
    );
    seedRegularUserId = seedRegularUser.id;

    const seedMachine = await machineRepository.save(
      machineRepository.create({
        name: `Seed Machine ${suffix}`,
        serialNumber: `SEED-SN-${suffix}`,
        companyId: seedCompanyId,
      }),
    );
    seedMachineId = seedMachine.id;
  });

  afterAll(async () => {
    if (machineId) {
      await machineRepository.delete(machineId);
    }
    if (userId) {
      await userRepository.delete(userId);
    }
    if (companyId) {
      await companyRepository.delete(companyId);
    }
    if (seedUserId) {
      await userRepository.delete(seedUserId);
    }
    if (seedRegularUserId) {
      await userRepository.delete(seedRegularUserId);
    }
    if (seedMachineId) {
      await machineRepository.delete(seedMachineId);
    }
    if (seedCompanyId) {
      await companyRepository.delete(seedCompanyId);
    }
    await app.close();
  });

  it('GET / should return Hello World', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('protected CRUD routes should reject missing token', async () => {
    await request(app.getHttpServer()).get('/company').expect(401);
    await request(app.getHttpServer()).get('/user').expect(401);
    await request(app.getHttpServer()).get('/machine').expect(401);
  });

  it('POST /auth/login should reject invalid credentials', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: seedEmail,
        password: 'wrong-password',
      })
      .expect(401);
  });

  it('POST /auth/login should return JWT', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: seedEmail,
        password: seedPassword,
      })
      .expect(201);
    const body = response.body as unknown as AuthResponse;

    expect(typeof body.accessToken).toBe('string');
    expect(body.user.id).toBe(seedUserId);
    expect(body.user.password).toBeUndefined();
    expect(body.user.email).toBe(seedEmail);
    expect(body.user.role).toBe(UserRole.ADMIN);
    expect(body.user.companyId).toBe(seedCompanyId);
    accessToken = body.accessToken;
  });

  it('POST /auth/login should return JWT for USER', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: seedUserEmail,
        password: seedPassword,
      })
      .expect(201);
    const body = response.body as unknown as AuthResponse;

    expect(typeof body.accessToken).toBe('string');
    expect(body.user.id).toBe(seedRegularUserId);
    expect(body.user.email).toBe(seedUserEmail);
    expect(body.user.role).toBe(UserRole.USER);
    expect(body.user.companyId).toBe(seedCompanyId);
    userAccessToken = body.accessToken;
  });

  it('GET /auth/profile should reject missing token', () => {
    return request(app.getHttpServer()).get('/auth/profile').expect(401);
  });

  it('GET /auth/profile should return JWT payload', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const body = response.body as unknown as ProfileResponse;

    expect(body.id).toBe(seedUserId);
    expect(body.email).toBe(seedEmail);
    expect(body.role).toBe(UserRole.ADMIN);
    expect(body.companyId).toBe(seedCompanyId);
  });

  it('JWT payload should include sub, email, role and companyId', () => {
    const payload = JSON.parse(
      Buffer.from(accessToken.split('.')[1], 'base64url').toString('utf-8'),
    ) as {
      sub: number;
      email: string;
      role: UserRole;
      companyId: number;
    };

    expect(payload.sub).toBe(seedUserId);
    expect(payload.email).toBe(seedEmail);
    expect(payload.role).toBe(UserRole.ADMIN);
    expect(payload.companyId).toBe(seedCompanyId);
  });

  it('POST /company should validate payload with authenticated request', () => {
    return request(app.getHttpServer())
      .post('/company')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: '', unknown: true })
      .expect(400);
  });

  it('should run authenticated company CRUD without exposing user passwords', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/company')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: `Company E2E ${suffix}`,
        cnpj,
      })
      .expect(201);

    const created = createResponse.body as unknown as CompanyResponse;
    expect(typeof created.id).toBe('number');
    expect(created.name).toBe(`Company E2E ${suffix}`);
    expect(created.cnpj).toBe(cnpj);
    companyId = created.id;

    const listResponse = await request(app.getHttpServer())
      .get('/company')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const companies = listResponse.body as unknown as CompanyResponse[];
    expect(companies.some((company) => company.id === companyId)).toBe(true);
    expect(
      companies
        .flatMap((company) => company.users ?? [])
        .every((user) => !user.password),
    ).toBe(true);

    const findResponse = await request(app.getHttpServer())
      .get(`/company/${seedCompanyId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const seedCompany = findResponse.body as unknown as CompanyResponse;
    expect(seedCompany.id).toBe(seedCompanyId);
    expect((seedCompany.users ?? []).every((user) => !user.password)).toBe(
      true,
    );

    const updateResponse = await request(app.getHttpServer())
      .patch(`/company/${companyId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: `Company Updated ${suffix}` })
      .expect(200);
    const updated = updateResponse.body as unknown as CompanyResponse;
    expect(updated.name).toBe(`Company Updated ${suffix}`);
  });

  it('should run authenticated user CRUD without returning password', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/user')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: `User E2E ${suffix}`,
        email: `user-${suffix}@momesso.com`,
        password: '123456',
        role: UserRole.USER,
        companyId,
      })
      .expect(201);

    const created = createResponse.body as unknown as UserResponse;
    expect(typeof created.id).toBe('number');
    expect(created.password).toBeUndefined();
    userId = created.id;

    const listResponse = await request(app.getHttpServer())
      .get('/user')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const users = listResponse.body as unknown as UserResponse[];
    expect(users.some((user) => user.id === userId)).toBe(true);
    expect(users.every((user) => !user.password)).toBe(true);

    const findResponse = await request(app.getHttpServer())
      .get(`/user/${userId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const found = findResponse.body as unknown as UserResponse;
    expect(found.id).toBe(userId);
    expect(found.password).toBeUndefined();

    const updateResponse = await request(app.getHttpServer())
      .patch(`/user/${userId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: `User Updated ${suffix}` })
      .expect(200);
    const updated = updateResponse.body as unknown as UserResponse;
    expect(updated.name).toBe(`User Updated ${suffix}`);
    expect(updated.password).toBeUndefined();
  });

  it('should run authenticated machine CRUD', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/machine')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: `Machine E2E ${suffix}`,
        serialNumber: `SN-${suffix}`,
        companyId,
      })
      .expect(201);
    const created = createResponse.body as unknown as MachineResponse;
    expect(typeof created.id).toBe('number');
    machineId = created.id;

    const listResponse = await request(app.getHttpServer())
      .get('/machine')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const machines = listResponse.body as unknown as MachineResponse[];
    expect(machines.some((machine) => machine.id === machineId)).toBe(true);

    const findResponse = await request(app.getHttpServer())
      .get(`/machine/${machineId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const found = findResponse.body as unknown as MachineResponse;
    expect(found.id).toBe(machineId);

    const updateResponse = await request(app.getHttpServer())
      .patch(`/machine/${machineId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: `Machine Updated ${suffix}` })
      .expect(200);
    const updated = updateResponse.body as unknown as MachineResponse;
    expect(updated.name).toBe(`Machine Updated ${suffix}`);
  });

  it('USER should only access records from own company', async () => {
    const companiesResponse = await request(app.getHttpServer())
      .get('/company')
      .set('Authorization', `Bearer ${userAccessToken}`)
      .expect(200);
    const companies = companiesResponse.body as unknown as CompanyResponse[];
    expect(companies.map((company) => company.id)).toEqual([seedCompanyId]);

    const usersResponse = await request(app.getHttpServer())
      .get('/user')
      .set('Authorization', `Bearer ${userAccessToken}`)
      .expect(200);
    const users = usersResponse.body as unknown as UserResponse[];
    expect(users.length).toBeGreaterThan(0);
    expect(users.every((user) => user.companyId === seedCompanyId)).toBe(true);
    expect(users.every((user) => !user.password)).toBe(true);

    const machinesResponse = await request(app.getHttpServer())
      .get('/machine')
      .set('Authorization', `Bearer ${userAccessToken}`)
      .expect(200);
    const machines = machinesResponse.body as unknown as MachineResponse[];
    expect(machines.length).toBeGreaterThan(0);
    expect(
      machines.every((machine) => machine.companyId === seedCompanyId),
    ).toBe(true);

    await request(app.getHttpServer())
      .get(`/company/${companyId}`)
      .set('Authorization', `Bearer ${userAccessToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get(`/user/${userId}`)
      .set('Authorization', `Bearer ${userAccessToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get(`/machine/${machineId}`)
      .set('Authorization', `Bearer ${userAccessToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/machine/${machineId}`)
      .set('Authorization', `Bearer ${userAccessToken}`)
      .send({ name: 'Forbidden Update' })
      .expect(403);
  });

  it('USER should be blocked from administrative writes even within own company', async () => {
    await request(app.getHttpServer())
      .post('/company')
      .set('Authorization', `Bearer ${userAccessToken}`)
      .send({
        name: `Forbidden Company ${suffix}`,
        cnpj: `forbidden-${suffix}`,
      })
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/company/${seedCompanyId}`)
      .set('Authorization', `Bearer ${userAccessToken}`)
      .send({ name: 'Forbidden Company Update' })
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/company/${seedCompanyId}`)
      .set('Authorization', `Bearer ${userAccessToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .post('/user')
      .set('Authorization', `Bearer ${userAccessToken}`)
      .send({
        name: `Forbidden Admin ${suffix}`,
        email: `forbidden-admin-${suffix}@momesso.com`,
        password: '123456',
        role: UserRole.ADMIN,
        companyId: seedCompanyId,
      })
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/user/${seedRegularUserId}`)
      .set('Authorization', `Bearer ${userAccessToken}`)
      .send({ name: 'Forbidden User Update' })
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/user/${seedRegularUserId}`)
      .set('Authorization', `Bearer ${userAccessToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .post('/machine')
      .set('Authorization', `Bearer ${userAccessToken}`)
      .send({
        name: `Forbidden Machine ${suffix}`,
        serialNumber: `FORBIDDEN-SN-${suffix}`,
        companyId: seedCompanyId,
      })
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/machine/${seedMachineId}`)
      .set('Authorization', `Bearer ${userAccessToken}`)
      .send({ name: 'Forbidden Machine Update' })
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/machine/${seedMachineId}`)
      .set('Authorization', `Bearer ${userAccessToken}`)
      .expect(403);
  });

  it('DELETE endpoints should remove created resources with token', async () => {
    await request(app.getHttpServer())
      .delete(`/machine/${machineId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    machineId = 0;

    await request(app.getHttpServer())
      .delete(`/user/${userId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    userId = 0;

    await request(app.getHttpServer())
      .delete(`/company/${companyId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    companyId = 0;
  });
});
