import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { AppModule } from '../app.module';
import { Company } from '../company/entities/company.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { Machine } from '../machine/entities/machine.entity';
import { User } from '../user/entities/user.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const companyRepository = app.get<Repository<Company>>(
    getRepositoryToken(Company),
  );
  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
  const machineRepository = app.get<Repository<Machine>>(
    getRepositoryToken(Machine),
  );

  let company = await companyRepository.findOne({
    where: { cnpj: '00000000000191' },
  });

  if (company) {
    company.name = 'Momesso Seed Company';
    company = await companyRepository.save(company);
  } else {
    company = await companyRepository.save(
      companyRepository.create({
        name: 'Momesso Seed Company',
        cnpj: '00000000000191',
      }),
    );
  }

  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const userPassword = await bcrypt.hash('User@123', 10);

  const admin = await userRepository.findOne({
    where: { email: 'admin@momesso.com' },
    select: { id: true },
  });

  if (admin) {
    await userRepository.update(admin.id, {
      name: 'Admin Momesso',
      password: adminPassword,
      role: UserRole.ADMIN,
      companyId: company.id,
    });
  } else {
    await userRepository.save(
      userRepository.create({
        name: 'Admin Momesso',
        email: 'admin@momesso.com',
        password: adminPassword,
        role: UserRole.ADMIN,
        companyId: company.id,
      }),
    );
  }

  const user = await userRepository.findOne({
    where: { email: 'user@momesso.com' },
    select: { id: true },
  });

  if (user) {
    await userRepository.update(user.id, {
      name: 'User Momesso',
      password: userPassword,
      role: UserRole.USER,
      companyId: company.id,
    });
  } else {
    await userRepository.save(
      userRepository.create({
        name: 'User Momesso',
        email: 'user@momesso.com',
        password: userPassword,
        role: UserRole.USER,
        companyId: company.id,
      }),
    );
  }

  const machine = await machineRepository.findOne({
    where: { serialNumber: 'SEED-MACHINE-001' },
  });

  if (machine) {
    await machineRepository.update(machine.id, {
      name: 'Seed Machine',
      companyId: company.id,
    });
  } else {
    await machineRepository.save(
      machineRepository.create({
        name: 'Seed Machine',
        serialNumber: 'SEED-MACHINE-001',
        companyId: company.id,
      }),
    );
  }

  await app.close();
}

void bootstrap();
