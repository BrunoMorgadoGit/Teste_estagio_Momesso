# Teste Técnico MOMESSO

Aplicação full stack para gerenciamento de empresas, usuários e máquinas, desenvolvida para o teste técnico da MOMESSO.

## Objetivo

O projeto entrega uma API em NestJS e um front-end em Angular com autenticação JWT, CRUD completo para administradores, visualização restrita para usuários comuns, relacionamento entre entidades e regras de acesso por perfil.

## Tecnologias

### Back-end

- NestJS
- TypeORM
- PostgreSQL
- JWT com Passport
- bcrypt
- class-validator
- Jest

### Front-end

- Angular standalone components
- Reactive Forms
- Angular Router
- HTTP Interceptor para JWT
- Playwright
- Vitest

## Funcionalidades

- Login com JWT.
- Rotas protegidas no front-end e back-end.
- CRUD de Empresas:
  - criar
  - listar
  - buscar por ID via API
  - atualizar
  - remover
- CRUD de Usuários:
  - criar
  - listar
  - buscar por ID via API
  - atualizar
  - remover
- CRUD de Máquinas:
  - criar
  - listar
  - buscar por ID via API
  - atualizar
  - remover
- Usuário `ADMIN` visualiza e gerencia todos os registros.
- Usuário `USER` visualiza apenas registros da própria empresa.
- Usuário `USER` navega nas mesmas telas, porém em modo somente leitura.
- Seed com usuários e dados iniciais.
- Arquivo SQL com políticas PostgreSQL RLS.

## Estrutura

```text
backend/   API NestJS
frontend/  Aplicação Angular
```

## Pré-requisitos

- Node.js 20+
- npm
- Docker e Docker Compose

## Como Rodar

### Opção A: Desenvolvimento Local

#### 1. Subir PostgreSQL

```bash
cd backend
docker compose up -d
```

#### 2. Rodar o back-end

```bash
cd backend
npm install
npm run seed
npm run start:dev
```

A API roda em:

```text
http://localhost:3000
```

#### 3. Rodar o front-end

Em outro terminal:

```bash
cd frontend
npm install
npm start
```

O front-end roda em:

```text
http://localhost:4200
```

O front-end usa `frontend/proxy.conf.json` para encaminhar `/api/*` para o back-end.

### Opção B: Docker Compose Completo

Na raiz do projeto:

```bash
docker compose up --build -d
```

Depois rode o seed uma vez:

```bash
docker compose run --rm backend npm run seed:prod
```

Aplicação:

```text
http://localhost:4200
```

No Docker Compose completo, apenas o front-end/Nginx fica exposto. O back-end fica interno na rede Docker e é acessado pelo navegador através de `/api`, com proxy reverso no Nginx.

## Usuários de Teste

Criados pelo seed:

```text
ADMIN
email: admin@momesso.com
senha: Admin@123

USER
email: user@momesso.com
senha: User@123
```

## Endpoints Principais

### Auth

```text
POST /auth/login
GET  /auth/profile
```

### Company

```text
POST   /company
GET    /company
GET    /company/:id
PATCH  /company/:id
DELETE /company/:id
```

### User

```text
POST   /user
GET    /user
GET    /user/:id
PATCH  /user/:id
DELETE /user/:id
```

### Machine

```text
POST   /machine
GET    /machine
GET    /machine/:id
PATCH  /machine/:id
DELETE /machine/:id
```

As rotas de CRUD exigem:

```http
Authorization: Bearer <token>
```

Permissões:

- `ADMIN`: CRUD completo de empresas, usuários e máquinas.
- `USER`: somente leitura de empresa, usuários e máquinas da própria `companyId`.
- `USER`: recebe `403 Forbidden` ao tentar criar, editar ou excluir registros administrativos.

## Segurança e RLS

As regras de acesso estão implementadas na camada NestJS usando o usuário autenticado no JWT.

Também foi incluído o diferencial de PostgreSQL Row Level Security em:

```text
backend/database/rls-policies.sql
```

Para aplicar:

```bash
cd backend
npm run rls:apply
```

As policies usam as variáveis de sessão:

```text
app.current_role
app.current_company_id
```

## Segurança HTTP

O back-end usa:

- `helmet` para headers HTTP de segurança.
- `ValidationPipe` com `whitelist`, `forbidNonWhitelisted` e `transform`.
- JWT nas rotas protegidas.
- Rate limiting global com `@nestjs/throttler`.
- `trust proxy` habilitado para rate limit correto atrás de proxy/cloud.
- CORS controlado por `CORS_ORIGIN`.

Variáveis relevantes:

```text
CORS_ORIGIN=http://localhost:4200
RATE_LIMIT_TTL_MS=60000
RATE_LIMIT_MAX=100
TYPEORM_SYNCHRONIZE=true
```

Em produção:

- use `TYPEORM_SYNCHRONIZE=false`
- troque `JWT_SECRET`
- use HTTPS
- guarde segredos no Secret Manager ou equivalente

## Proxy do Front-end

Em desenvolvimento, `frontend/proxy.conf.json` encaminha:

```text
/api -> http://localhost:3000
```

Em produção Docker, `frontend/nginx.conf` serve o Angular e faz proxy reverso:

```text
/api -> backend:3000
```

Isso permite expor um domínio único ao usuário e evita colocar a URL interna do back-end no JavaScript do front-end.

## Testes

### Back-end

```bash
cd backend
npm run build
npm test
```

### Front-end

```bash
cd frontend
npm run build
npm test
npm run test:e2e
```

Os testes e2e sobem o back-end e o front-end conforme `frontend/playwright.config.ts`.

## Deploy GCP

O guia de deploy está em:

```text
docs/DEPLOY_GCP.md
```

Ele cobre Artifact Registry, Cloud Run, Cloud SQL, Secret Manager e domínio.

## Observações de Entrega

- O projeto utiliza `synchronize: true` no TypeORM para facilitar a avaliação em ambiente de desenvolvimento.
- O primeiro usuário administrador é criado via seed.
- As senhas não são exibidas no front-end nem retornadas nas listagens da API.
- IDs são gerados pelo banco de dados e não são reiniciados manualmente.
