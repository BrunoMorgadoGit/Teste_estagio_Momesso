import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Company } from '../../core/models/company.model';
import { CreateUserRequest, User } from '../../core/models/user.model';
import { CompanyService } from '../../core/services/company.service';
import { UserService } from '../../core/services/user.service';
import { UsersComponent } from './users.component';

const companiesMock: Company[] = [
  {
    id: 1,
    name: 'Momesso Seed Company',
    cnpj: '00000000000191',
    createdAt: '2026-05-23T00:00:00.000Z'
  }
];

const usersMock: User[] = [
  {
    id: 1,
    name: 'Admin Momesso',
    email: 'admin@momesso.com',
    role: 'ADMIN',
    companyId: 1,
    createdAt: '2026-05-23T00:00:00.000Z'
  }
];

describe('UsersComponent', () => {
  let fixture: ComponentFixture<UsersComponent>;
  let component: UsersComponent;
  let userService: {
    findAll: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };
  let companyService: { findAll: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    userService = {
      findAll: vi.fn<() => Observable<User[]>>(),
      create: vi.fn<(payload: CreateUserRequest) => Observable<User>>(),
      update: vi.fn<(id: number, payload: Partial<CreateUserRequest>) => Observable<User>>(),
      remove: vi.fn<(id: number) => Observable<void>>()
    };
    companyService = {
      findAll: vi.fn<() => Observable<Company[]>>()
    };

    userService.findAll.mockReturnValue(of(usersMock));
    companyService.findAll.mockReturnValue(of(companiesMock));

    TestBed.configureTestingModule({
      imports: [UsersComponent],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: CompanyService, useValue: companyService }
      ]
    });

    fixture = TestBed.createComponent(UsersComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('loads users on init and renders them without user interaction', () => {
    fixture.detectChanges();

    expect(userService.findAll).toHaveBeenCalledTimes(1);
    expect(companyService.findAll).toHaveBeenCalledTimes(1);
    expect(component.users).toEqual(usersMock);
    expect(component.companies).toEqual(companiesMock);
    expect(component.usersLoaded).toBe(true);
    expect(component.usersLoading).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Admin Momesso');
  });

  it('shows loading while users are being fetched', () => {
    const usersRequest = new Subject<User[]>();
    userService.findAll.mockReturnValue(usersRequest.asObservable());

    fixture.detectChanges();

    expect(component.usersLoading).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Carregando usuários...');

    usersRequest.next(usersMock);
    usersRequest.complete();
    fixture.detectChanges();

    expect(component.usersLoading).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Admin Momesso');
  });

  it('uses the same listing method when refresh is clicked', () => {
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.table-header .button').click();
    fixture.detectChanges();

    expect(userService.findAll).toHaveBeenCalledTimes(2);
  });

  it('focuses and highlights the form when starting a new user', () => {
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

  it('sends the correct payload and reloads after creating a user', () => {
    userService.create.mockReturnValue(of(usersMock[0]));
    fixture.detectChanges();
    component.form.setValue({
      name: ' Novo Usuário ',
      email: 'novo@momesso.com',
      password: 'User@123',
      role: 'USER',
      companyId: 1
    });

    component.save();

    expect(userService.create).toHaveBeenCalledWith({
      name: 'Novo Usuário',
      email: 'novo@momesso.com',
      password: 'User@123',
      role: 'USER',
      companyId: 1
    });
    expect(userService.findAll).toHaveBeenCalledTimes(2);
    expect(component.message).toBe('Usuário criado.');
    expect(component.loading).toBe(false);
  });

  it('shows a clear error when user creation fails', () => {
    userService.create.mockReturnValue(throwError(() => ({ status: 409 })));
    fixture.detectChanges();
    component.form.setValue({
      name: 'Novo Usuário',
      email: 'novo@momesso.com',
      password: 'User@123',
      role: 'USER',
      companyId: 1
    });

    component.save();

    expect(component.errorMessage).toBe(
      'Não foi possível criar o usuário. Verifique os dados e tente novamente.'
    );
    expect(component.loading).toBe(false);
  });

  it('sends the correct payload and reloads after editing a user', () => {
    userService.update.mockReturnValue(of({ ...usersMock[0], name: 'Admin Editado' }));
    fixture.detectChanges();
    component.edit(usersMock[0]);
    component.form.setValue({
      name: 'Admin Editado',
      email: 'admin.editado@momesso.com',
      password: '',
      role: 'ADMIN',
      companyId: 1
    });

    component.save();

    expect(userService.update).toHaveBeenCalledWith(1, {
      name: 'Admin Editado',
      email: 'admin.editado@momesso.com',
      role: 'ADMIN',
      companyId: 1
    });
    expect(userService.findAll).toHaveBeenCalledTimes(2);
    expect(component.message).toBe('Usuário atualizado.');
  });

  it('reloads after deleting a user', () => {
    userService.remove.mockReturnValue(of(undefined));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fixture.detectChanges();

    component.remove(usersMock[0]);

    expect(userService.remove).toHaveBeenCalledWith(1);
    expect(userService.findAll).toHaveBeenCalledTimes(2);
    expect(component.message).toBe('Usuário excluído.');
  });
});
