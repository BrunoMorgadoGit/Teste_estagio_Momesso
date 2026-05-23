import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Company } from '../../core/models/company.model';
import { CreateMachineRequest, Machine } from '../../core/models/machine.model';
import { CompanyService } from '../../core/services/company.service';
import { MachineService } from '../../core/services/machine.service';
import { MachinesComponent } from './machines.component';

const companiesMock: Company[] = [
  {
    id: 1,
    name: 'Momesso Seed Company',
    cnpj: '00000000000191',
    createdAt: '2026-05-23T00:00:00.000Z'
  }
];

const machinesMock: Machine[] = [
  {
    id: 1,
    name: 'Seed Machine',
    serialNumber: 'SEED-MACHINE-001',
    companyId: 1,
    createdAt: '2026-05-23T00:00:00.000Z'
  }
];

describe('MachinesComponent', () => {
  let fixture: ComponentFixture<MachinesComponent>;
  let component: MachinesComponent;
  let machineService: {
    findAll: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };
  let companyService: { findAll: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    machineService = {
      findAll: vi.fn<() => Observable<Machine[]>>(),
      create: vi.fn<(payload: CreateMachineRequest) => Observable<Machine>>(),
      update: vi.fn<(id: number, payload: CreateMachineRequest) => Observable<Machine>>(),
      remove: vi.fn<(id: number) => Observable<void>>()
    };
    companyService = {
      findAll: vi.fn<() => Observable<Company[]>>()
    };

    machineService.findAll.mockReturnValue(of(machinesMock));
    companyService.findAll.mockReturnValue(of(companiesMock));

    TestBed.configureTestingModule({
      imports: [MachinesComponent],
      providers: [
        { provide: MachineService, useValue: machineService },
        { provide: CompanyService, useValue: companyService }
      ]
    });

    fixture = TestBed.createComponent(MachinesComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('loads machines on init and renders them without user interaction', () => {
    fixture.detectChanges();

    expect(machineService.findAll).toHaveBeenCalledTimes(1);
    expect(companyService.findAll).toHaveBeenCalledTimes(1);
    expect(component.machines).toEqual(machinesMock);
    expect(component.companies).toEqual(companiesMock);
    expect(component.machinesLoaded).toBe(true);
    expect(component.machinesLoading).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Seed Machine');
  });

  it('shows loading while machines are being fetched', () => {
    const machinesRequest = new Subject<Machine[]>();
    machineService.findAll.mockReturnValue(machinesRequest.asObservable());

    fixture.detectChanges();

    expect(component.machinesLoading).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Carregando máquinas...');

    machinesRequest.next(machinesMock);
    machinesRequest.complete();
    fixture.detectChanges();

    expect(component.machinesLoading).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Seed Machine');
  });

  it('uses the same listing method when refresh is clicked', () => {
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.table-header .button').click();
    fixture.detectChanges();

    expect(machineService.findAll).toHaveBeenCalledTimes(2);
  });

  it('focuses and highlights the form when starting a new machine', () => {
    vi.useFakeTimers();
    fixture.detectChanges();
    const formPanel = fixture.nativeElement.querySelector('.panel') as HTMLElement;
    const nameInput = fixture.nativeElement.querySelector('input[formcontrolname="name"]') as HTMLInputElement;
    const scrollIntoView = vi.fn();
    formPanel.scrollIntoView = scrollIntoView;

    fixture.nativeElement.querySelector('.page-header .button').click();
    fixture.detectChanges();

    expect(component.editingId).toBeNull();
    expect(component.formHighlighted).toBe(true);
    expect(component.form.controls.companyId.value).toBe(1);

    vi.runOnlyPendingTimers();

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(document.activeElement).toBe(nameInput);
    expect(component.formHighlighted).toBe(false);
  });

  it('sends the correct payload and reloads after creating a machine', () => {
    machineService.create.mockReturnValue(of(machinesMock[0]));
    fixture.detectChanges();
    component.form.setValue({
      name: ' Máquina Nova ',
      serialNumber: ' MACHINE-002 ',
      companyId: 1
    });

    component.save();

    expect(machineService.create).toHaveBeenCalledWith({
      name: 'Máquina Nova',
      serialNumber: 'MACHINE-002',
      companyId: 1
    });
    expect(machineService.findAll).toHaveBeenCalledTimes(2);
    expect(component.message).toBe('Máquina criada.');
    expect(component.loading).toBe(false);
  });

  it('shows a clear error when machine creation fails', () => {
    machineService.create.mockReturnValue(throwError(() => ({ status: 409 })));
    fixture.detectChanges();
    component.form.setValue({
      name: 'Máquina Nova',
      serialNumber: 'MACHINE-002',
      companyId: 1
    });

    component.save();

    expect(component.errorMessage).toBe(
      'Não foi possível criar a máquina. Verifique os dados e tente novamente.'
    );
    expect(component.loading).toBe(false);
  });

  it('sends the correct payload and reloads after editing a machine', () => {
    machineService.update.mockReturnValue(of({ ...machinesMock[0], name: 'Máquina Editada' }));
    fixture.detectChanges();
    component.edit(machinesMock[0]);
    component.form.setValue({
      name: 'Máquina Editada',
      serialNumber: 'SEED-MACHINE-001',
      companyId: 1
    });

    component.save();

    expect(machineService.update).toHaveBeenCalledWith(1, {
      name: 'Máquina Editada',
      serialNumber: 'SEED-MACHINE-001',
      companyId: 1
    });
    expect(machineService.findAll).toHaveBeenCalledTimes(2);
    expect(component.message).toBe('Máquina atualizada.');
  });

  it('reloads after deleting a machine', () => {
    machineService.remove.mockReturnValue(of(undefined));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fixture.detectChanges();

    component.remove(machinesMock[0]);

    expect(machineService.remove).toHaveBeenCalledWith(1);
    expect(machineService.findAll).toHaveBeenCalledTimes(2);
    expect(component.message).toBe('Máquina excluída.');
  });
});
