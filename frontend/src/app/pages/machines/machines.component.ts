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
import { CreateMachineRequest, Machine } from '../../core/models/machine.model';
import { AuthService } from '../../core/services/auth.service';
import { CompanyService } from '../../core/services/company.service';
import { MachineService } from '../../core/services/machine.service';

@Component({
  selector: 'app-machines',
  imports: [ReactiveFormsModule],
  template: `
    <section class="page-header">
      <div>
        <p class="eyebrow">{{ isAdmin ? 'Admin' : 'Consulta' }} / Máquinas</p>
        <h2>Máquinas</h2>
        <p class="page-subtitle">
          {{ isAdmin
            ? 'Gerencie as máquinas cadastradas no sistema.'
            : 'Visualize apenas as máquinas da sua própria empresa.' }}
        </p>
      </div>
      @if (isAdmin) {
        <button type="button" class="button primary" (click)="startNewMachine()">
          <span aria-hidden="true">+</span>
          Nova máquina
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
      <div class="alert success">Seu perfil possui acesso somente para consulta de máquinas.</div>
    }

    @if (isAdmin) {
      <section #machineFormPanel class="panel" [class.panel-highlight]="formHighlighted" tabindex="-1">
        <div class="panel-heading">
          <div>
            <h3>{{ editingId ? 'Editar máquina' : 'Cadastrar máquina' }}</h3>
            <p>Informe os dados principais e o vínculo da máquina com a empresa.</p>
          </div>
        </div>
        <form [formGroup]="form" (ngSubmit)="save()" class="entity-form">
          <label>
            Nome
            <input #machineNameInput type="text" formControlName="name" placeholder="Ex.: Injetora 01" />
          </label>
          <label>
            Número de série
            <input type="text" formControlName="serialNumber" placeholder="Ex.: MAQ-001" />
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
              {{ editingId ? 'Salvar alterações' : 'Criar máquina' }}
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
        <h3>Máquinas cadastradas</h3>
        <button type="button" class="button secondary" (click)="loadMachines()" [disabled]="machinesLoading">
          {{ machinesLoading ? 'Atualizando...' : 'Atualizar' }}
        </button>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Número de série</th>
              <th>Company ID</th>
              <th>Criado em</th>
              @if (isAdmin) {
                <th>Ações</th>
              }
            </tr>
          </thead>
          <tbody>
            @if (machinesLoading) {
              <tr>
                <td [attr.colspan]="isAdmin ? 6 : 5" class="empty-state">
                  <div class="empty-state-content">
                    <span class="loading-dot" aria-hidden="true"></span>
                    <strong>Carregando máquinas...</strong>
                    <span>Aguarde enquanto os dados são buscados.</span>
                  </div>
                </td>
              </tr>
            } @else if (errorMessage && machinesLoaded && machines.length === 0) {
              <tr>
                <td [attr.colspan]="isAdmin ? 6 : 5" class="empty-state">
                  <div class="empty-state-content">
                    <strong>Não foi possível carregar as máquinas.</strong>
                    <span>Verifique sua conexão ou tente atualizar novamente.</span>
                  </div>
                </td>
              </tr>
            } @else {
              @for (machine of machines; track machine.id) {
                <tr>
                  <td>{{ machine.id }}</td>
                  <td>{{ machine.name }}</td>
                  <td>{{ machine.serialNumber }}</td>
                  <td>{{ machine.companyId }}</td>
                  <td>{{ formatDate(machine.createdAt) }}</td>
                  @if (isAdmin) {
                    <td class="actions">
                      <button type="button" class="button compact" (click)="edit(machine)">Editar</button>
                      <button type="button" class="button danger compact" (click)="remove(machine)">Excluir</button>
                    </td>
                  }
                </tr>
              } @empty {
                <tr>
                  <td [attr.colspan]="isAdmin ? 6 : 5" class="empty-state">
                    <div class="empty-state-content">
                      <strong>Nenhuma máquina encontrada.</strong>
                      <span>Cadastre sua primeira máquina para começar.</span>
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
export class MachinesComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly machineService = inject(MachineService);
  private readonly companyService = inject(CompanyService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  @ViewChild('machineFormPanel') private readonly machineFormPanel?: ElementRef<HTMLElement>;
  @ViewChild('machineNameInput') private readonly machineNameInput?: ElementRef<HTMLInputElement>;

  companies: Company[] = [];
  machines: Machine[] = [];
  editingId: number | null = null;
  loading = false;
  machinesLoading = false;
  machinesLoaded = false;
  formHighlighted = false;
  errorMessage = '';
  message = '';
  readonly isAdmin = this.authService.isAdmin();

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    serialNumber: ['', [Validators.required]],
    companyId: [0, [Validators.required, Validators.min(1)]]
  });

  ngOnInit(): void {
    this.loadCompanies();
    this.loadMachines();
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
        this.errorMessage = 'Não foi possível carregar as empresas para vincular a máquina.';
      }
    });
  }

  loadMachines(): void {
    this.errorMessage = '';
    this.machinesLoading = true;

    this.machineService.findAll().pipe(
      finalize(() => {
        this.machinesLoading = false;
        this.machinesLoaded = true;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (machines) => {
        this.machines = [...machines];
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
    const payload = this.buildPayload(this.form.getRawValue());
    const request = this.editingId
      ? this.machineService.update(this.editingId, payload)
      : this.machineService.create(payload);

    request.subscribe({
      next: () => {
        this.message = this.editingId ? 'Máquina atualizada.' : 'Máquina criada.';
        this.resetForm();
        this.loadMachines();
      },
      error: (error) => this.handleSaveError(error)
    }).add(() => (this.loading = false));
  }

  edit(machine: Machine): void {
    if (!this.isAdmin) {
      this.blockAdminOnlyAction();
      return;
    }

    this.editingId = machine.id;
    this.form.patchValue({
      name: machine.name,
      serialNumber: machine.serialNumber,
      companyId: machine.companyId
    });
    this.focusMachineForm();
  }

  remove(machine: Machine): void {
    if (!this.isAdmin) {
      this.blockAdminOnlyAction();
      return;
    }

    if (!confirm(`Excluir máquina ${machine.name}?`)) {
      return;
    }

    this.clearMessages();
    this.machineService.remove(machine.id).subscribe({
      next: () => {
        this.message = 'Máquina excluída.';
        this.loadMachines();
      },
      error: (error) => this.handleRemoveError(error)
    });
  }

  resetForm(): void {
    this.editingId = null;
    this.form.reset({
      name: '',
      serialNumber: '',
      companyId: this.defaultCompanyId()
    });
  }

  startNewMachine(): void {
    if (!this.isAdmin) {
      this.blockAdminOnlyAction();
      return;
    }

    this.resetForm();
    this.focusMachineForm();
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleString('pt-BR');
  }

  private clearMessages(): void {
    this.message = '';
    this.errorMessage = '';
  }

  private defaultCompanyId(): number {
    return this.companies[0]?.id ?? 0;
  }

  private buildPayload(raw: CreateMachineRequest): CreateMachineRequest {
    return {
      name: raw.name.trim(),
      serialNumber: raw.serialNumber.trim(),
      companyId: Number(raw.companyId)
    };
  }

  private focusMachineForm(): void {
    this.formHighlighted = true;
    this.cdr.detectChanges();

    window.setTimeout(() => {
      this.machineFormPanel?.nativeElement.scrollIntoView?.({
        behavior: 'smooth',
        block: 'start'
      });
      this.machineNameInput?.nativeElement.focus();
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
      ? 'Não foi possível atualizar a máquina. Verifique os dados e tente novamente.'
      : 'Não foi possível criar a máquina. Verifique os dados e tente novamente.';
  }

  private handleRemoveError(error: { status?: number }): void {
    this.errorMessage = error.status === 403
      ? 'Acesso negado para esta operação.'
      : 'Não foi possível excluir a máquina. Tente novamente.';
  }

  private blockAdminOnlyAction(): void {
    this.message = '';
    this.errorMessage = 'Somente administradores podem criar, editar ou excluir máquinas.';
  }
}
