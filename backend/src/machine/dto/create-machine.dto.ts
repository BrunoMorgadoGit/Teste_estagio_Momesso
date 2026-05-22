import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateMachineDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  serialNumber: string;

  @IsInt()
  companyId: number;
}
