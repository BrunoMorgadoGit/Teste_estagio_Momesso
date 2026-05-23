import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { Company } from '../../core/models/company.model';
import { CreateUserRequest, UpdateUserRequest, User, UserRole } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { CompanyService } from '../../core/services/company.service';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-users',
  imports: [ReactiveFormsModule],
  template: `
    <section class="page-header">
      <div>
        <p class="eyebrow">{{ isAdmin ? 'Admin' : 'Consulta' }} / Usuários</p>
        <h2>Usuários</h2>
        <p class="page-subtitle">
          {{ isAdmin
            ? 'Gerencie os usuários cadastrados no sistema.'
            : 'Visualize apenas os usuários da sua própria empresa.' }}
        </p>
      </div>
      @if (isAdmin) {
        <button type="button" class="button primary" (click)="startNewUser()">
          <span aria-hidden="true">+</span>
          Novo usuário
        </button>
      }
    </section>

    @if (message) {
      <div class="alert success">{{ message }}</div>
    }
    @if (errorMessage) {
      <div class="alert error">{{ errorMessage }}</div>
    }
    @if (!isAdmin) {
      <div class="alert success">Seu perfil possui acesso somente para consulta de usuários.</div>
    }

    @if (isAdmin) {
      <section #userFormPanel class="panel" [class.panel-highlight]="formHighlighted" tabindex="-1">
        <div class="panel-heading">
          <div>
            <h3>{{ editingId ? 'Editar usuário' : 'Cadastrar usuário' }}</h3>
            <p>Informe os dados de acesso e vínculo corporativo do usuário.</p>
          </div>
        </div>
        <form [formGroup]="form" (ngSubmit)="save()" class="entity-form">
          <label>
            Nome
            <input #userNameInput type="text" formControlName="name" placeholder="Ex.: Admin Momesso" />
          </label>
          <label>
            Email
            <input type="email" formControlName="email" placeholder="usuario@momesso.com" />
          </label>
          <label>
            Senha
            <input type="password" formControlName="password" [placeholder]="editingId ? 'Deixe em branco para manter' : ''" />
          </label>
          <label>
            Role
            <select formControlName="role">
              <option value="ADMIN">ADMIN</option>
              <option value="USER">USER</option>
            </select>
          </label>
          <label>
            Empresa
            <select formControlName="companyId">
              <option [ngValue]="0">Selecione uma empresa</option>
              @for (company of companies; track company.id) {
                <option [ngValue]="company.id">{{ company.name }} #{{ company.id }}</option>
              }
            </select>
          </label>
          <div class="form-actions">
            <button class="button primary" type="submit" [disabled]="form.invalid || loading">
              {{ editingId ? 'Salvar alterações' : 'Criar usuário' }}
            </button>
            @if (editingId) {
              <button type="button" class="button secondary" (click)="resetForm()">Cancelar</button>
            }
          </div>
        </form>
      </section>
    }

    <section class="panel">
      <div class="table-header">
        <h3>Usuários cadastrados</h3>
        <button type="button" class="button secondary" (click)="loadUsers()" [disabled]="usersLoading">
          {{ usersLoading ? 'Atualizando...' : 'Atualizar' }}
        </button>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Email</th>
              <th>Role</th>
              <th>Company ID</th>
              <th>Criado em</th>
              @if (isAdmin) {
                <th>Ações</th>
              }
            </tr>
          </thead>
          <tbody>
            @if (usersLoading) {
              <tr>
                <td [attr.colspan]="isAdmin ? 7 : 6" class="empty-state">
                  <div class="empty-state-content">
                    <span class="loading-dot" aria-hidden="true"></span>
                    <strong>Carregando usuários...</strong>
                    <span>Aguarde enquanto os dados são buscados.</span>
                  </div>
                </td>
              </tr>
            } @else if (errorMessage && usersLoaded && users.length === 0) {
              <tr>
                <td [attr.colspan]="isAdmin ? 7 : 6" class="empty-state">
                  <div class="empty-state-content">
                    <strong>Não foi possível carregar os usuários.</strong>
                    <span>Verifique sua conexão ou tente atualizar novamente.</span>
                  </div>
                </td>
              </tr>
            } @else {
              @for (user of users; track user.id) {
                <tr>
                  <td>{{ user.id }}</td>
                  <td>{{ user.name }}</td>
                  <td>{{ user.email }}</td>
                  <td><span class="badge">{{ user.role }}</span></td>
                  <td>{{ user.companyId }}</td>
                  <td>{{ formatDate(user.createdAt) }}</td>
                  @if (isAdmin) {
                    <td class="actions">
                      <button type="button" class="button compact" (click)="edit(user)">Editar</button>
                      <button type="button" class="button danger compact" (click)="remove(user)">Excluir</button>
                    </td>
                  }
                </tr>
              } @empty {
                <tr>
                  <td [attr.colspan]="isAdmin ? 7 : 6" class="empty-state">
                    <div class="empty-state-content">
                      <strong>Nenhum usuário encontrado.</strong>
                      <span>Cadastre seu primeiro usuário para começar.</span>
                    </div>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </section>
  `
})
export class UsersComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly companyService = inject(CompanyService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  @ViewChild('userFormPanel') private readonly userFormPanel?: ElementRef<HTMLElement>;
  @ViewChild('userNameInput') private readonly userNameInput?: ElementRef<HTMLInputElement>;

  companies: Company[] = [];
  users: User[] = [];
  editingId: number | null = null;
  loading = false;
  usersLoading = false;
  usersLoaded = false;
  formHighlighted = false;
  errorMessage = '';
  message = '';
  readonly isAdmin = this.authService.isAdmin();

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    role: ['USER' as UserRole, [Validators.required]],
    companyId: [0, [Validators.required, Validators.min(1)]]
  });

  ngOnInit(): void {
    this.loadCompanies();
    this.loadUsers();
  }

  loadCompanies(): void {
    this.companyService.findAll().subscribe({
      next: (companies) => {
        this.companies = [...companies];

        if (!this.editingId && this.form.controls.companyId.value === 0) {
          this.form.controls.companyId.setValue(this.defaultCompanyId());
        }
      },
      error: () => {
        this.errorMessage = 'Não foi possível carregar as empresas para vincular o usuário.';
      }
    });
  }

  loadUsers(): void {
    this.errorMessage = '';
    this.usersLoading = true;

    this.userService.findAll().pipe(
      finalize(() => {
        this.usersLoading = false;
        this.usersLoaded = true;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (users) => {
        this.users = [...users];
      },
      error: (error) => this.handleError(error)
    });
  }

  save(): void {
    if (!this.isAdmin) {
      this.blockAdminOnlyAction();
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.clearMessages();
    const raw = this.form.getRawValue();
    const payload = this.buildCreatePayload(raw);
    const request = this.editingId
      ? this.userService.update(this.editingId, this.buildUpdatePayload(raw))
      : this.userService.create(payload);

    request.subscribe({
      next: () => {
        this.message = this.editingId ? 'Usuário atualizado.' : 'Usuário criado.';
        this.resetForm();
        this.loadUsers();
      },
      error: (error) => this.handleSaveError(error)
    }).add(() => (this.loading = false));
  }

  edit(user: User): void {
    if (!this.isAdmin) {
      this.blockAdminOnlyAction();
      return;
    }

    this.editingId = user.id;
    this.form.controls.password.clearValidators();
    this.form.controls.password.updateValueAndValidity();
    this.form.patchValue({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      companyId: user.companyId
    });
    this.focusUserForm();
  }

  remove(user: User): void {
    if (!this.isAdmin) {
      this.blockAdminOnlyAction();
      return;
    }

    if (!confirm(`Excluir usuário ${user.name}?`)) {
      return;
    }

    this.clearMessages();
    this.userService.remove(user.id).subscribe({
      next: () => {
        this.message = 'Usuário excluído.';
        this.loadUsers();
      },
      error: (error) => this.handleRemoveError(error)
    });
  }

  resetForm(): void {
    this.editingId = null;
    this.form.reset({
      name: '',
      email: '',
      password: '',
      role: 'USER',
      companyId: this.defaultCompanyId()
    });
    this.form.controls.password.setValidators([Validators.required]);
    this.form.controls.password.updateValueAndValidity();
  }

  startNewUser(): void {
    if (!this.isAdmin) {
      this.blockAdminOnlyAction();
      return;
    }

    this.resetForm();
    this.focusUserForm();
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleString('pt-BR');
  }

  private buildCreatePayload(raw: CreateUserRequest): CreateUserRequest {
    return {
      name: raw.name.trim(),
      email: raw.email.trim(),
      password: raw.password,
      role: raw.role,
      companyId: Number(raw.companyId)
    };
  }

  private buildUpdatePayload(raw: CreateUserRequest): UpdateUserRequest {
    const payload: UpdateUserRequest = {
      name: raw.name.trim(),
      email: raw.email.trim(),
      role: raw.role,
      companyId: Number(raw.companyId)
    };

    if (raw.password) {
      payload.password = raw.password;
    }

    return payload;
  }

  private clearMessages(): void {
    this.message = '';
    this.errorMessage = '';
  }

  private defaultCompanyId(): number {
    return this.companies[0]?.id ?? 0;
  }

  private focusUserForm(): void {
    this.formHighlighted = true;
    this.cdr.detectChanges();

    window.setTimeout(() => {
      this.userFormPanel?.nativeElement.scrollIntoView?.({
        behavior: 'smooth',
        block: 'start'
      });
      this.userNameInput?.nativeElement.focus();
    });

    window.setTimeout(() => {
      this.formHighlighted = false;
      this.cdr.detectChanges();
    }, 1400);
  }

  private handleError(error: { status?: number }): void {
    this.errorMessage = error.status === 403
      ? 'Acesso negado para esta operação.'
      : 'Não foi possível processar a solicitação.';
  }

  private handleSaveError(error: { status?: number }): void {
    if (error.status === 403) {
      this.errorMessage = 'Acesso negado para esta operação.';
      return;
    }

    this.errorMessage = this.editingId
      ? 'Não foi possível atualizar o usuário. Verifique os dados e tente novamente.'
      : 'Não foi possível criar o usuário. Verifique os dados e tente novamente.';
  }

  private handleRemoveError(error: { status?: number }): void {
    this.errorMessage = error.status === 403
      ? 'Acesso negado para esta operação.'
      : 'Não foi possível excluir o usuário. Tente novamente.';
  }

  private blockAdminOnlyAction(): void {
    this.message = '';
    this.errorMessage = 'Somente administradores podem criar, editar ou excluir usuários.';
  }
}
