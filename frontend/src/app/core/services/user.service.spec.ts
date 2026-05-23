import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UserService, provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('lists users from /api/user', () => {
    service.findAll().subscribe();

    const request = httpMock.expectOne('/api/user');
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('creates a user with the expected payload', () => {
    const payload = {
      name: 'Usuário Teste',
      email: 'usuario.teste@momesso.com',
      password: 'User@123',
      role: 'USER' as const,
      companyId: 1
    };

    service.create(payload).subscribe();

    const request = httpMock.expectOne('/api/user');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({ id: 1, ...payload, createdAt: '2026-05-23T00:00:00.000Z' });
  });

  it('updates and removes users by id', () => {
    service.update(1, { name: 'Usuário Editado' }).subscribe();
    const patchRequest = httpMock.expectOne('/api/user/1');
    expect(patchRequest.request.method).toBe('PATCH');
    expect(patchRequest.request.body).toEqual({ name: 'Usuário Editado' });
    patchRequest.flush({});

    service.remove(1).subscribe();
    const deleteRequest = httpMock.expectOne('/api/user/1');
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush(null);
  });
});
