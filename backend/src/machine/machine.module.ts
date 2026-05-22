import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MachineService } from './machine.service';
import { MachineController } from './machine.controller';
import { Company } from '../company/entities/company.entity';
import { Machine } from './entities/machine.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Machine, Company])],
  controllers: [MachineController],
  providers: [MachineService],
})
export class MachineModule {}
