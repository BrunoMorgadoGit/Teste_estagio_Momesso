import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CompanyService } from './company.service';

describe('CompanyService', () => {
  let service: CompanyService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CompanyService, provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(CompanyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('lists companies from /api/company', () => {
    service.findAll().subscribe();

    const request = httpMock.expectOne('/api/company');
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('creates a company with the expected payload', () => {
    const payload = { name: 'Empresa Teste', cnpj: '12345678000199' };

    service.create(payload).subscribe();

    const request = httpMock.expectOne('/api/company');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({ id: 1, ...payload, createdAt: '2026-05-23T00:00:00.000Z' });
  });

  it('updates and removes companies by id', () => {
    service.update(1, { name: 'Empresa Editada' }).subscribe();
    const patchRequest = httpMock.expectOne('/api/company/1');
    expect(patchRequest.request.method).toBe('PATCH');
    expect(patchRequest.request.body).toEqual({ name: 'Empresa Editada' });
    patchRequest.flush({});

    service.remove(1).subscribe();
    const deleteRequest = httpMock.expectOne('/api/company/1');
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush(null);
  });
});
