export interface Machine {
  id: number;
  name: string;
  serialNumber: string;
  companyId: number;
  createdAt: string;
}

export interface CreateMachineRequest {
  name: string;
  serialNumber: string;
  companyId: number;
}

export type UpdateMachineRequest = Partial<CreateMachineRequest>;
