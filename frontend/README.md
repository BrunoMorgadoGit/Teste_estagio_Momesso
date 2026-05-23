# Frontend Momesso

Aplicação Angular para consumir o backend NestJS do teste técnico Momesso.

## Tecnologias

- Angular standalone components
- Reactive Forms
- Angular Router
- HTTP Interceptor com JWT
- Proxy de desenvolvimento para a API NestJS

## Como rodar

```bash
cd frontend
npm install
npm start
```

Front-end:

```text
http://localhost:4200
```

Backend esperado:

```text
http://localhost:3000
```

## Proxy da API

O arquivo `proxy.conf.json` redireciona chamadas iniciadas por `/api` para o backend:

```text
/api/auth/login -> http://localhost:3000/auth/login
/api/company -> http://localhost:3000/company
/api/user -> http://localhost:3000/user
/api/machine -> http://localhost:3000/machine
```

O script `npm start` já usa:

```bash
ng serve --proxy-config proxy.conf.json
```

## Docker/Produção

O front-end possui `Dockerfile` e `nginx.conf`.

Em produção Docker, o Nginx:

- serve os arquivos estáticos do Angular;
- mantém as rotas SPA funcionando com fallback para `index.html`;
- aplica headers básicos de segurança;
- encaminha `/api/*` para o serviço interno `backend:3000`.

Assim, o navegador usa o mesmo domínio para front-end e API, sem expor a URL interna do back-end no bundle Angular.

## Login de teste

Use os usuários criados pelo seed do backend:

```text
ADMIN
email: admin@momesso.com
senha: Admin@123

USER
email: user@momesso.com
senha: User@123
```

## Telas implementadas

- `/login`: autenticação com JWT.
- `/companies`: CRUD completo para `ADMIN` e visualização da própria empresa para `USER`.
- `/users`: CRUD completo para `ADMIN` e visualização dos usuários da própria empresa para `USER`.
- `/machines`: CRUD completo para `ADMIN` e visualização das máquinas da própria empresa para `USER`.

Rotas internas são protegidas por `AuthGuard`. O token é salvo em `localStorage` e enviado automaticamente em requisições HTTP com `Authorization: Bearer TOKEN`.

## Como testar

1. Suba o backend na porta `3000`.
2. Rode o seed do backend, se necessário.
3. Inicie o front com `npm start`.
4. Abra `http://localhost:4200`.
5. Tente acessar `/companies` sem login: deve redirecionar para `/login`.
6. Faça login com o usuário ADMIN e valide o CRUD completo.
7. Faça logout e entre com o usuário USER.
8. Valide que a sidebar mostra email e role corretos.
9. Valide que USER não vê botões administrativos e acessa apenas dados da própria empresa.
10. Faça logout e confirme que o token foi removido.

O front-end não exibe senha de usuário em nenhuma tabela ou tela pública.
