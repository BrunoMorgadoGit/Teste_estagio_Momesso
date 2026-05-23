import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: `
    <main class="login-page">
      <section class="login-hero" aria-label="Apresentação MOMESSO">
        <div class="login-hero-content">
          <div class="login-hero-brand">
            <img class="login-hero-logo" src="/logomomesso.webp" alt="MOMESSO" />
          </div>
          <div>
            <p class="eyebrow">Portal corporativo</p>
            <h1>Gestão industrial com controle e segurança.</h1>
            <p>
              Ambiente integrado para acompanhar empresas, usuários e máquinas com a
              consistência que a operação exige.
            </p>
          </div>
          <div class="login-hero-meta" aria-label="Recursos do sistema">
            <span>Empresas</span>
            <span>Usuários</span>
            <span>Máquinas</span>
          </div>
        </div>
      </section>

      <section class="login-panel" aria-label="Acesso ao sistema">
        <div class="login-card">
          <div class="login-card-brand">
            <img class="login-logo" src="/logomomesso.webp" alt="MOMESSO" />
          </div>
          <p class="eyebrow">Acesso restrito</p>
          <h2>Entrar no sistema</h2>
          <p class="muted">Informe suas credenciais para acessar o painel administrativo.</p>

          <form [formGroup]="form" (ngSubmit)="submit()" class="form-grid">
            <label>
              Email
              <span class="input-shell">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 6h16v12H4z" />
                  <path d="m4 7 8 6 8-6" />
                </svg>
                <input type="email" formControlName="email" placeholder="seu.email@momesso.com" />
              </span>
            </label>
            @if (isInvalid('email')) {
              <small class="field-error">Informe um email válido.</small>
            }

            <label>
              Senha
              <span class="input-shell">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="5" y="10" width="14" height="10" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
                <input
                  [type]="passwordVisible ? 'text' : 'password'"
                  formControlName="password"
                  placeholder="Digite sua senha"
                />
                <button
                  class="password-toggle"
                  type="button"
                  (click)="togglePasswordVisibility()"
                  [attr.aria-label]="passwordVisible ? 'Ocultar senha' : 'Mostrar senha'"
                >
                  @if (passwordVisible) {
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="m3 3 18 18" />
                      <path d="M10.7 5.1a10.9 10.9 0 0 1 1.3-.1c5 0 8.5 4.5 9.5 6.3a1.4 1.4 0 0 1 0 1.4 16.2 16.2 0 0 1-2.8 3.5" />
                      <path d="M6.6 6.6a16.4 16.4 0 0 0-4.1 4.7 1.4 1.4 0 0 0 0 1.4C3.5 14.5 7 19 12 19a9.9 9.9 0 0 0 4.1-.9" />
                      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                    </svg>
                  } @else {
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M2.5 11.3C3.5 9.5 7 5 12 5s8.5 4.5 9.5 6.3a1.4 1.4 0 0 1 0 1.4C20.5 14.5 17 19 12 19s-8.5-4.5-9.5-6.3a1.4 1.4 0 0 1 0-1.4Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  }
                </button>
              </span>
            </label>
            @if (isInvalid('password')) {
              <small class="field-error">Informe a senha.</small>
            }

            @if (errorMessage) {
              <div class="alert error">{{ errorMessage }}</div>
            }

            <button
              class="button primary full"
              type="submit"
              [class.is-loading]="loading"
              [disabled]="form.invalid || loading"
            >
              {{ loading ? 'Entrando...' : 'Entrar' }}
            </button>
          </form>

          <p class="login-footer">Sistema de gestão MOMESSO</p>
        </div>
      </section>
    </main>
  `
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  loading = false;
  errorMessage = '';
  passwordVisible = false;

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { email, password } = this.form.getRawValue();

    this.authService
      .login(email, password)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => this.router.navigate(['/companies']),
        error: (error) => {
          this.errorMessage = this.getLoginErrorMessage(error?.status);
        }
      });
  }

  private getLoginErrorMessage(status?: number): string {
    switch (status) {
      case 0:
        return 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.';
      case 401:
      case 403:
        return 'Email ou senha inválidos.';
      default:
        return 'Não foi possível entrar. Tente novamente.';
      }
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  isInvalid(controlName: 'email' | 'password'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }
}
