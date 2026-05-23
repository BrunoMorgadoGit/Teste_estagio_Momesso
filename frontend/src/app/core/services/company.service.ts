import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Company, CreateCompanyRequest, UpdateCompanyRequest } from '../models/company.model';

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/company';

  findAll(): Observable<Company[]> {
    return this.http.get<Company[]>(this.apiUrl);
  }

  findOne(id: number): Observable<Company> {
    return this.http.get<Company>(`${this.apiUrl}/${id}`);
  }

  create(payload: CreateCompanyRequest): Observable<Company> {
    return this.http.post<Company>(this.apiUrl, payload);
  }

  update(id: number, payload: UpdateCompanyRequest): Observable<Company> {
    return this.http.patch<Company>(`${this.apiUrl}/${id}`, payload);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
