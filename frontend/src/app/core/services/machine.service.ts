import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { CreateMachineRequest, Machine, UpdateMachineRequest } from '../models/machine.model';

@Injectable({ providedIn: 'root' })
export class MachineService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/machine';

  findAll(): Observable<Machine[]> {
    return this.http.get<Machine[]>(this.apiUrl);
  }

  findOne(id: number): Observable<Machine> {
    return this.http.get<Machine>(`${this.apiUrl}/${id}`);
  }

  create(payload: CreateMachineRequest): Observable<Machine> {
    return this.http.post<Machine>(this.apiUrl, payload);
  }

  update(id: number, payload: UpdateMachineRequest): Observable<Machine> {
    return this.http.patch<Machine>(`${this.apiUrl}/${id}`, payload);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
