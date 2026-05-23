import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LoginResponse } from '../../core/models/auth.model';
import { AuthService } from '../../core/services/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let authService: { login: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authService = {
      login: vi.fn<() => Observable<LoginResponse>>()
    };
    router = {
      navigate: vi.fn()
    };

    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router }
      ]
    });

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('logs in and redirects to /companies', () => {
    authService.login.mockReturnValue(of({ accessToken: 'jwt-token' }));
    component.form.setValue({
      email: 'admin@momesso.com',
      password: 'Admin@123'
    });

    component.submit();

    expect(authService.login).toHaveBeenCalledWith('admin@momesso.com', 'Admin@123');
    expect(router.navigate).toHaveBeenCalledWith(['/companies']);
    expect(component.loading).toBe(false);
    expect(component.errorMessage).toBe('');
  });

  it('stops loading and shows a friendly message when credentials are rejected', () => {
    authService.login.mockReturnValue(throwError(() => ({ status: 401 })));
    component.form.setValue({
      email: 'admin@momesso.com',
      password: 'wrong-password'
    });

    component.submit();

    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.loading).toBe(false);
    expect(component.errorMessage).toBe('Email ou senha inválidos.');
  });

  it('stops loading and explains when the backend is unreachable', () => {
    authService.login.mockReturnValue(throwError(() => ({ status: 0 })));
    component.form.setValue({
      email: 'admin@momesso.com',
      password: 'Admin@123'
    });

    component.submit();

    expect(component.loading).toBe(false);
    expect(component.errorMessage).toBe(
      'Não foi possível conectar ao servidor. Verifique se o backend está rodando.'
    );
  });
});
