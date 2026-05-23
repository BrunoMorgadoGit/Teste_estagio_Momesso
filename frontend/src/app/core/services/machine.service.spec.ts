import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { MachineService } from './machine.service';

describe('MachineService', () => {
  let service: MachineService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MachineService, provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(MachineService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('lists machines from /api/machine', () => {
    service.findAll().subscribe();

    const request = httpMock.expectOne('/api/machine');
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('creates a machine with the expected payload', () => {
    const payload = {
      name: 'Máquina Teste',
      serialNumber: 'MACHINE-TEST-001',
      companyId: 1
    };

    service.create(payload).subscribe();

    const request = httpMock.expectOne('/api/machine');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({ id: 1, ...payload, createdAt: '2026-05-23T00:00:00.000Z' });
  });

  it('updates and removes machines by id', () => {
    service.update(1, { name: 'Máquina Editada' }).subscribe();
    const patchRequest = httpMock.expectOne('/api/machine/1');
    expect(patchRequest.request.method).toBe('PATCH');
    expect(patchRequest.request.body).toEqual({ name: 'Máquina Editada' });
    patchRequest.flush({});

    service.remove(1).subscribe();
    const deleteRequest = httpMock.expectOne('/api/machine/1');
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush(null);
  });
});
