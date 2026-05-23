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

import { Company, CreateCompanyRequest } from '../../core/models/company.model';
import { CompanyService } from '../../core/services/company.service';

@Component({
  selector: 'app-companies',
  imports: [ReactiveFormsModule],
  template: `
    <section class="page-header">
      <div>
        <p class="eyebrow">Admin / Empresas</p>
        <h2>Empresas</h2>
        <p class="page-subtitle">Gerencie as empresas cadastradas no sistema.</p>
      </div>
      <button type="button" class="button primary" (click)="startNewCompany()">
        <span aria-hidden="true">+</span>
        Nova empresa
      </button>
    </section>

    @if (message) {
      <div class="alert success">{{ message }}</div>
    }
    @if (errorMessage) {
      <div class="alert error">{{ errorMessage }}</div>
    }

    <section
      #companyFormPanel
      class="panel"
      [class.panel-highlight]="formHighlighted"
      tabindex="-1"
    >
      <div class="panel-heading">
        <div>
          <h3>{{ editingId ? 'Editar empresa' : 'Cadastrar empresa' }}</h3>
          <p>
            Preencha os dados principais para manter o cadastro corporativo atualizado.
          </p>
        </div>
      </div>
      <form [formGroup]="form" (ngSubmit)="save()" class="entity-form">
        <label>
          Nome
          <input
            #companyNameInput
            type="text"
            formControlName="name"
            placeholder="Ex.: Momesso Industrial"
          />
        </label>
        <label>
          CNPJ
          <input type="text" formControlName="cnpj" placeholder="00.000.000/0001-00" />
        </label>
        <div class="form-actions">
          <button class="button primary" type="submit" [disabled]="form.invalid || loading">
            {{ editingId ? 'Salvar alterações' : 'Criar empresa' }}
          </button>
          @if (editingId) {
            <button type="button" class="button secondary" (click)="resetForm()">Cancelar</button>
          }
        </div>
      </form>
    </section>

    <section class="panel">
      <div class="table-header">
        <h3>Empresas cadastradas</h3>
        <button
          type="button"
          class="button secondary"
          (click)="loadCompanies()"
          [disabled]="companiesLoading"
        >
          {{ companiesLoading ? 'Atualizando...' : 'Atualizar' }}
        </button>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>CNPJ</th>
              <th>Criado em</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            @if (companiesLoading) {
              <tr>
                <td colspan="5" class="empty-state">
                  <div class="empty-state-content">
                    <span class="loading-dot" aria-hidden="true"></span>
                    <strong>Carregando empresas...</strong>
                    <span>Aguarde enquanto os dados são buscados.</span>
                  </div>
                </td>
              </tr>
            } @else if (errorMessage && companiesLoaded && companies.length === 0) {
              <tr>
                <td colspan="5" class="empty-state">
                  <div class="empty-state-content">
                    <strong>Não foi possível carregar as empresas.</strong>
                    <span>Verifique sua conexão ou tente atualizar novamente.</span>
                  </div>
                </td>
              </tr>
            } @else {
              @for (company of companies; track company.id) {
                <tr>
                  <td>{{ company.id }}</td>
                  <td>{{ company.name }}</td>
                  <td>{{ company.cnpj }}</td>
                  <td>{{ formatDate(company.createdAt) }}</td>
                  <td class="actions">
                    <button type="button" class="button compact" (click)="edit(company)">Editar</button>
                    <button type="button" class="button danger compact" (click)="remove(company)">Excluir</button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="empty-state">
                    <div class="empty-state-content">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
                        <path d="M16 8h2a2 2 0 0 1 2 2v11" />
                        <path d="M8 7h4M8 11h4M8 15h4M3 21h18" />
                      </svg>
                      <strong>Nenhuma empresa encontrada.</strong>
                      <span>Cadastre sua primeira empresa para começar.</span>
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
export class CompaniesComponent implements OnInit {
  private readonly companyService = inject(CompanyService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  @ViewChild('companyFormPanel') private readonly companyFormPanel?: ElementRef<HTMLElement>;
  @ViewChild('companyNameInput') private readonly companyNameInput?: ElementRef<HTMLInputElement>;

  companies: Company[] = [];
  editingId: number | null = null;
  loading = false;
  companiesLoading = false;
  companiesLoaded = false;
  formHighlighted = false;
  errorMessage = '';
  message = '';

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    cnpj: ['', [Validators.required]]
  });

  ngOnInit(): void {
    this.loadCompanies();
  }

  loadCompanies(): void {
    this.errorMessage = '';
    this.companiesLoading = true;

    this.companyService.findAll().pipe(
      finalize(() => {
        this.companiesLoading = false;
        this.companiesLoaded = true;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (companies) => {
        this.companies = [...companies];
      },
      error: (error) => this.handleError(error)
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.clearMessages();
    const payload: CreateCompanyRequest = this.form.getRawValue();
    const request = this.editingId
      ? this.companyService.update(this.editingId, payload)
      : this.companyService.create(payload);

    request.subscribe({
      next: () => {
        this.message = this.editingId ? 'Empresa atualizada.' : 'Empresa criada.';
        this.resetForm();
        this.loadCompanies();
      },
      error: (error) => this.handleError(error)
    }).add(() => (this.loading = false));
  }

  edit(company: Company): void {
    this.editingId = company.id;
    this.form.patchValue({ name: company.name, cnpj: company.cnpj });
    this.focusCompanyForm();
  }

  remove(company: Company): void {
    if (!confirm(`Excluir empresa ${company.name}?`)) {
      return;
    }

    this.clearMessages();
    this.companyService.remove(company.id).subscribe({
      next: () => {
        this.message = 'Empresa excluída.';
        this.loadCompanies();
      },
      error: (error) => this.handleError(error)
    });
  }

  resetForm(): void {
    this.editingId = null;
    this.form.reset();
  }

  startNewCompany(): void {
    this.resetForm();
    this.focusCompanyForm();
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleString('pt-BR');
  }

  private clearMessages(): void {
    this.message = '';
    this.errorMessage = '';
  }

  private focusCompanyForm(): void {
    this.formHighlighted = true;
    this.cdr.detectChanges();

    window.setTimeout(() => {
      this.companyFormPanel?.nativeElement.scrollIntoView?.({
        behavior: 'smooth',
        block: 'start'
      });
      this.companyNameInput?.nativeElement.focus();
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
}
