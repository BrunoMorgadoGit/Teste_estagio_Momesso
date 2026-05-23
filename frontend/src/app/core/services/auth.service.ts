import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { AuthenticatedUser, LoginResponse } from '../models/auth.model';

const TOKEN_KEY = 'token';
const LEGACY_TOKEN_KEY = 'momesso_access_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', { email, password }).pipe(
      tap((response) => {
        const token = response.access_token ?? response.accessToken ?? response.token;

        if (!token) {
          throw new Error('Token not found in login response');
        }

        this.setToken(token);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(LEGACY_TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();

    if (!token) {
      return false;
    }

    const user = this.getUserFromToken();

    if (user?.exp && Date.now() >= user.exp * 1000) {
      localStorage.removeItem(TOKEN_KEY);
      return false;
    }

    return true;
  }

  getUserFromToken(): AuthenticatedUser | null {
    const token = this.getToken();

    if (!token) {
      return null;
    }

    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload)) as AuthenticatedUser;
    } catch {
      return null;
    }
  }

  isAdmin(): boolean {
    return this.getUserFromToken()?.role === 'ADMIN';
  }

  private setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  }
}
