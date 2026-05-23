import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Company, CreateCompanyRequest } from '../../core/models/company.model';
import { AuthService } from '../../core/services/auth.service';
import { CompanyService } from '../../core/services/company.service';
import { CompaniesComponent } from './companies.component';

const companiesMock: Company[] = [
  {
    id: 1,
    name: 'Momesso Seed Company',
    cnpj: '00000000000191',
    createdAt: '2026-05-23T00:00:00.000Z'
  }
];

describe('CompaniesComponent', () => {
  let fixture: ComponentFixture<CompaniesComponent>;
  let component: CompaniesComponent;
  let companyService: {
    findAll: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };
  let authService: { isAdmin: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    companyService = {
      findAll: vi.fn<() => Observable<Company[]>>(),
      create: vi.fn<(payload: CreateCompanyRequest) => Observable<Company>>(),
      update: vi.fn<(id: number, payload: CreateCompanyRequest) => Observable<Company>>(),
      remove: vi.fn<(id: number) => Observable<void>>()
    };
    authService = {
      isAdmin: vi.fn(() => true)
    };

    companyService.findAll.mockReturnValue(of(companiesMock));

    TestBed.configureTestingModule({
      imports: [CompaniesComponent],
      providers: [
        { provide: CompanyService, useValue: companyService },
        { provide: AuthService, useValue: authService }
      ]
    });

    fixture = TestBed.createComponent(CompaniesComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('loads companies on init and renders them without user interaction', () => {
    fixture.detectChanges();

    expect(companyService.findAll).toHaveBeenCalledTimes(1);
    expect(component.companies).toEqual(companiesMock);
    expect(component.companiesLoaded).toBe(true);
    expect(component.companiesLoading).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Momesso Seed Company');
    expect(fixture.nativeElement.textContent).not.toContain('Nenhuma empresa encontrada.');
  });

  it('shows table loading before the request finishes and hides the empty state', () => {
    const companiesRequest = new Subject<Company[]>();
    companyService.findAll.mockReturnValue(companiesRequest.asObservable());

    fixture.detectChanges();

    expect(component.companiesLoading).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Carregando empresas...');
    expect(fixture.nativeElement.textContent).not.toContain('Nenhuma empresa encontrada.');

    companiesRequest.next(companiesMock);
    companiesRequest.complete();
    fixture.detectChanges();

    expect(component.companiesLoading).toBe(false);
    expect(component.companiesLoaded).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Momesso Seed Company');
  });

  it('uses the same listing method when the refresh button is clicked', () => {
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.table-header .button').click();
    fixture.detectChanges();

    expect(companyService.findAll).toHaveBeenCalledTimes(2);
  });

  it('focuses and highlights the company form when starting a new company', () => {
    vi.useFakeTimers();
    fixture.detectChanges();
    component.edit(companiesMock[0]);
    const formPanel = fixture.nativeElement.querySelector('.panel') as HTMLElement;
    const nameInput = fixture.nativeElement.querySelector('input[formcontrolname="name"]') as HTMLInputElement;
    const scrollIntoView = vi.fn();
    formPanel.scrollIntoView = scrollIntoView;

    fixture.nativeElement.querySelector('.page-header .button').click();
    fixture.detectChanges();

    expect(component.editingId).toBeNull();
    expect(component.form.getRawValue()).toEqual({ name: '', cnpj: '' });
    expect(component.formHighlighted).toBe(true);
    expect(formPanel.classList.contains('panel-highlight')).toBe(true);

    vi.runOnlyPendingTimers();

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(document.activeElement).toBe(nameInput);
    expect(component.formHighlighted).toBe(false);
  });

  it('reloads the listing after creating a company', () => {
    companyService.create.mockReturnValue(of(companiesMock[0]));
    fixture.detectChanges();
    component.form.setValue({ name: 'Nova Empresa', cnpj: '12345678000199' });

    component.save();

    expect(companyService.create).toHaveBeenCalledWith({
      name: 'Nova Empresa',
      cnpj: '12345678000199'
    });
    expect(companyService.findAll).toHaveBeenCalledTimes(2);
    expect(component.message).toBe('Empresa criada.');
    expect(component.loading).toBe(false);
  });

  it('reloads the listing after editing a company', () => {
    companyService.update.mockReturnValue(of({ ...companiesMock[0], name: 'Empresa Editada' }));
    fixture.detectChanges();
    component.edit(companiesMock[0]);
    component.form.setValue({ name: 'Empresa Editada', cnpj: '00000000000191' });

    component.save();

    expect(companyService.update).toHaveBeenCalledWith(1, {
      name: 'Empresa Editada',
      cnpj: '00000000000191'
    });
    expect(companyService.findAll).toHaveBeenCalledTimes(2);
    expect(component.message).toBe('Empresa atualizada.');
    expect(component.loading).toBe(false);
  });

  it('reloads the listing after deleting a company', () => {
    companyService.remove.mockReturnValue(of(undefined));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fixture.detectChanges();

    component.remove(companiesMock[0]);

    expect(companyService.remove).toHaveBeenCalledWith(1);
    expect(companyService.findAll).toHaveBeenCalledTimes(2);
    expect(component.message).toBe('Empresa excluída.');
  });

  it('shows an error state when the listing request fails', () => {
    companyService.findAll.mockReturnValue(throwError(() => ({ status: 500 })));

    fixture.detectChanges();

    expect(component.companiesLoading).toBe(false);
    expect(component.companiesLoaded).toBe(true);
    expect(component.errorMessage).toBe('Não foi possível processar a solicitação.');
    expect(fixture.nativeElement.textContent).toContain('Não foi possível carregar as empresas.');
  });

  it('renders companies in read-only mode for USER', () => {
    authService.isAdmin.mockReturnValue(false);
    fixture = TestBed.createComponent(CompaniesComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Seu perfil possui acesso somente para consulta de empresas.'
    );
    expect(fixture.nativeElement.textContent).not.toContain('Nova empresa');
    expect(fixture.nativeElement.textContent).not.toContain('Editar');
    expect(fixture.nativeElement.textContent).not.toContain('Excluir');
  });
});
