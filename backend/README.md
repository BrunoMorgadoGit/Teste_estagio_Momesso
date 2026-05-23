# Momesso Backend

API NestJS para gerenciamento de empresas, usuarios e maquinas com TypeORM, PostgreSQL, JWT, bcrypt e validacao por DTOs.

Tecnologias principais:

- NestJS
- TypeORM
- PostgreSQL
- JWT com Passport
- bcrypt
- class-validator

## Requisitos

- Node.js 20+
- npm
- Docker e Docker Compose

## Variaveis de ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=momesso
JWT_SECRET=supersecret
JWT_EXPIRES_IN=1d
TYPEORM_SYNCHRONIZE=true
CORS_ORIGIN=http://localhost:4200
RATE_LIMIT_TTL_MS=60000
RATE_LIMIT_MAX=100
```

## Docker/PostgreSQL

Suba o PostgreSQL:

```bash
docker compose up -d
```

O `docker-compose.yml` configura:

- database: `momesso`
- user: `postgres`
- password: `postgres`
- port: `5432`

## Como rodar

```bash
npm install
docker compose up -d
npm run seed
npm run start:dev
```

A API roda por padrao em:

```text
http://localhost:3000
```

## Testes

```bash
npm run build
npm test
npm run test:e2e
```

Os testes e2e precisam do PostgreSQL ativo.

## Banco e schema

O projeto usa `synchronize: true` no TypeORM para sincronizar as tabelas durante o desenvolvimento.

O diferencial de PostgreSQL RLS/Policies esta em:

```text
database/rls-policies.sql
```

Para aplicar:

```bash
npm run rls:apply
```

As policies usam as variaveis de sessao `app.current_role` e `app.current_company_id`. A API tambem aplica as mesmas regras na camada NestJS para manter o fluxo funcionando com TypeORM/JWT durante a avaliacao.

## Seed

Execute:

```bash
npm run seed
```

Dados criados/atualizados:

- Empresa: `Momesso Seed Company`
- Admin: `admin@momesso.com` / `Admin@123`
- User: `user@momesso.com` / `User@123`
- Maquina: `Seed Machine`

## Autenticacao

As rotas de CRUD sao protegidas com JWT. Envie:

```http
Authorization: Bearer <accessToken>
```

Login:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@momesso.com","password":"Admin@123"}'
```

Roles:

- `ADMIN`: acessa todos os registros.
- `USER`: acessa apenas empresas, usuarios e maquinas da propria empresa.
- `USER` recebe `403 Forbidden` ao tentar buscar dados de outra empresa.
- `USER` recebe `403 Forbidden` ao tentar criar, alterar ou remover empresas, usuarios e maquinas.
- Criacao, alteracao e remocao sao restritas a `ADMIN`.

Profile:

```bash
curl http://localhost:3000/auth/profile \
  -H "Authorization: Bearer <TOKEN>"
```

## Segurança HTTP

O backend aplica:

- `helmet` para headers de seguranca.
- `ValidationPipe` com whitelist, bloqueio de campos extras e transformacao.
- Rate limiting global com `@nestjs/throttler`.
- `trust proxy` para funcionar corretamente atras de Nginx, Cloud Run ou load balancer.
- CORS controlado por `CORS_ORIGIN`.

Em producao, use `TYPEORM_SYNCHRONIZE=false` e um `JWT_SECRET` forte armazenado em cofre de segredos.

## Endpoints

### Company

```bash
curl -X POST http://localhost:3000/company \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Momesso","cnpj":"12345678000199"}'

curl http://localhost:3000/company -H "Authorization: Bearer <TOKEN>"
curl http://localhost:3000/company/1 -H "Authorization: Bearer <TOKEN>"

curl -X PATCH http://localhost:3000/company/1 \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Momesso Atualizada"}'

curl -X DELETE http://localhost:3000/company/1 \
  -H "Authorization: Bearer <TOKEN>"
```

### User

```bash
curl -X POST http://localhost:3000/user \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Operador","email":"operador@momesso.com","password":"User@123","role":"USER","companyId":1}'

curl http://localhost:3000/user -H "Authorization: Bearer <TOKEN>"
curl http://localhost:3000/user/1 -H "Authorization: Bearer <TOKEN>"

curl -X PATCH http://localhost:3000/user/1 \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin Atualizado"}'

curl -X DELETE http://localhost:3000/user/1 \
  -H "Authorization: Bearer <TOKEN>"
```

### Machine

```bash
curl -X POST http://localhost:3000/machine \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Machine 01","serialNumber":"SN-001","companyId":1}'

curl http://localhost:3000/machine -H "Authorization: Bearer <TOKEN>"
curl http://localhost:3000/machine/1 -H "Authorization: Bearer <TOKEN>"

curl -X PATCH http://localhost:3000/machine/1 \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Machine Atualizada"}'

curl -X DELETE http://localhost:3000/machine/1 \
  -H "Authorization: Bearer <TOKEN>"
```

## Observacao sobre primeiro usuario

Como o CRUD de usuarios e protegido, o primeiro usuario admin deve ser criado via seed, script ou acesso direto ao banco. Os testes e2e fazem esse seed automaticamente usando o repository do TypeORM.
