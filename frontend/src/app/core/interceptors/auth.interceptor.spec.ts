import { Component } from '@angular/core';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { authInterceptor } from './auth.interceptor';

@Component({ template: '' })
class EmptyComponent {}

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', component: EmptyComponent }])
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('does not add Authorization to login requests', () => {
    localStorage.setItem('token', 'jwt-token');

    http.post('/api/auth/login', { email: 'admin@momesso.com', password: 'Admin@123' }).subscribe();

    const request = httpMock.expectOne('/api/auth/login');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({ accessToken: 'new-token' });
  });

  it('adds Authorization to authenticated API requests', () => {
    localStorage.setItem('token', 'jwt-token');

    http.get('/api/company').subscribe();

    const request = httpMock.expectOne('/api/company');
    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    request.flush([]);
  });

  it('removes the token after a 401 response', () => {
    localStorage.setItem('token', 'jwt-token');

    http.get('/api/company').subscribe({ error: () => undefined });

    const request = httpMock.expectOne('/api/company');
    request.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(localStorage.getItem('token')).toBeNull();
  });
});
