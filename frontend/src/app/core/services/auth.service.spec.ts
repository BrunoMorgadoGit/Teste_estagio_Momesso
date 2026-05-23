import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('posts email and password to /api/auth/login and stores accessToken', () => {
    service.login('admin@momesso.com', 'Admin@123').subscribe();

    const request = httpMock.expectOne('/api/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      email: 'admin@momesso.com',
      password: 'Admin@123'
    });

    request.flush({ accessToken: 'jwt-token' });

    expect(localStorage.getItem('token')).toBe('jwt-token');
    expect(localStorage.getItem('momesso_access_token')).toBeNull();
  });

  it('accepts access_token responses and keeps legacy tokens readable', () => {
    localStorage.setItem('momesso_access_token', 'legacy-token');
    expect(service.getToken()).toBe('legacy-token');

    service.login('admin@momesso.com', 'Admin@123').subscribe();
    httpMock.expectOne('/api/auth/login').flush({ access_token: 'snake-token' });

    expect(service.getToken()).toBe('snake-token');
    expect(localStorage.getItem('momesso_access_token')).toBeNull();
  });
});
