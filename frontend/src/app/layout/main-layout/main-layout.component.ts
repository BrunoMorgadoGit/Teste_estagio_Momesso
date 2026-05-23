import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <img src="/logomomesso.webp" alt="MOMESSO" />
          <span>{{ sidebarLabel }}</span>
        </div>

        <nav class="nav-links" aria-label="Menu principal">
          <a routerLink="/companies" routerLinkActive="active">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
              <path d="M16 8h2a2 2 0 0 1 2 2v11" />
              <path d="M8 7h4M8 11h4M8 15h4M3 21h18" />
            </svg>
            Empresas
          </a>
          <a routerLink="/users" routerLinkActive="active">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
            </svg>
            Usuários
          </a>
          <a routerLink="/machines" routerLinkActive="active">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 14h16v6H4z" />
              <path d="M6 14V8a6 6 0 0 1 12 0v6" />
              <path d="M8 17h.01M12 17h4" />
            </svg>
            Máquinas
          </a>
        </nav>

        <div class="user-box">
          <p class="eyebrow">Sessão ativa</p>
          <span>{{ userEmail }}</span>
          <strong>{{ userRole }}</strong>
          <button type="button" class="button secondary full" (click)="logout()">Sair</button>
        </div>
      </aside>

      <main class="content">
        <router-outlet />
      </main>
    </div>
  `
})
export class MainLayoutComponent {
  private readonly authService = inject(AuthService);
  readonly user = this.authService.getCurrentUser();
  readonly userEmail = this.user?.email ?? 'Usuário autenticado';
  readonly userRole = this.user?.role ?? 'USER';
  readonly sidebarLabel = `Painel ${this.userRole}`;

  logout(): void {
    this.authService.logout();
  }
}
