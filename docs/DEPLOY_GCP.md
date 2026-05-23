# Deploy no Google Cloud Platform

Este guia descreve um caminho seguro para publicar o projeto usando imagens Docker.

## Opção Recomendada

Para produção real, use:

- Cloud SQL for PostgreSQL
- Cloud Run para o back-end NestJS
- Cloud Run para o front-end Nginx/Angular ou Firebase Hosting/Cloud Storage + Load Balancer
- Secret Manager para `JWT_SECRET` e senha do banco
- HTTPS gerenciado pelo Google

## Preparação

Defina variáveis locais:

```bash
export PROJECT_ID="seu-projeto-gcp"
export REGION="southamerica-east1"
export REPOSITORY="momesso"
export DOMAIN="seudominio.com.br"
```

Autentique e selecione o projeto:

```bash
gcloud auth login
gcloud config set project "$PROJECT_ID"
gcloud services enable run.googleapis.com artifactregistry.googleapis.com sqladmin.googleapis.com secretmanager.googleapis.com
```

Crie o Artifact Registry:

```bash
gcloud artifacts repositories create "$REPOSITORY" \
  --repository-format=docker \
  --location="$REGION"
```

Configure o Docker:

```bash
gcloud auth configure-docker "$REGION-docker.pkg.dev"
```

## Build e Push das Imagens

Back-end:

```bash
docker build -t "$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/momesso-backend:latest" ./backend
docker push "$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/momesso-backend:latest"
```

Front-end:

```bash
docker build -t "$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/momesso-frontend:latest" ./frontend
docker push "$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/momesso-frontend:latest"
```

## Banco Cloud SQL

Crie uma instância PostgreSQL e um banco `momesso`. Guarde usuário, senha e connection name.

Exemplo:

```bash
gcloud sql instances create momesso-postgres \
  --database-version=POSTGRES_16 \
  --cpu=1 \
  --memory=3840MiB \
  --region="$REGION"

gcloud sql databases create momesso --instance=momesso-postgres
```

Em produção, use Secret Manager para a senha:

```bash
printf "sua-senha-segura" | gcloud secrets create momesso-db-password --data-file=-
printf "um-jwt-secret-longo-e-aleatorio" | gcloud secrets create momesso-jwt-secret --data-file=-
```

## Deploy do Back-end no Cloud Run

Substitua `INSTANCE_CONNECTION_NAME` pelo connection name do Cloud SQL.

```bash
gcloud run deploy momesso-backend \
  --image="$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/momesso-backend:latest" \
  --region="$REGION" \
  --allow-unauthenticated \
  --add-cloudsql-instances="INSTANCE_CONNECTION_NAME" \
  --set-env-vars="NODE_ENV=production,PORT=3000,DATABASE_HOST=/cloudsql/INSTANCE_CONNECTION_NAME,DATABASE_PORT=5432,DATABASE_USER=postgres,DATABASE_NAME=momesso,TYPEORM_SYNCHRONIZE=false,RATE_LIMIT_TTL_MS=60000,RATE_LIMIT_MAX=100" \
  --set-secrets="DATABASE_PASSWORD=momesso-db-password:latest,JWT_SECRET=momesso-jwt-secret:latest"
```

Depois execute o seed uma vez em um ambiente controlado. Para produção real, prefira migrations em vez de `synchronize`.

## Deploy do Front-end

O container Nginx do front-end faz proxy de `/api` para o host `backend` no Docker Compose. No Cloud Run, serviços separados não usam esse nome DNS automaticamente.

Para Cloud Run, há duas opções:

1. Usar um Load Balancer externo com roteamento:
   - `/api/*` -> serviço back-end
   - `/*` -> serviço front-end
2. Ajustar o `frontend/nginx.conf` no build para `proxy_pass` apontar para a URL interna/externa do serviço back-end.

Para manter a URL do back-end mascarada no navegador, prefira a opção 1 com Load Balancer e domínio único.

Deploy básico do front:

```bash
gcloud run deploy momesso-frontend \
  --image="$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/momesso-frontend:latest" \
  --region="$REGION" \
  --allow-unauthenticated
```

## Domínio

No Cloud Run:

```bash
gcloud run domain-mappings create \
  --service=momesso-frontend \
  --domain="$DOMAIN" \
  --region="$REGION"
```

Depois configure os registros DNS indicados pelo Google no provedor do domínio.

Para domínio único com `/api`, use Load Balancer HTTPS e certificados gerenciados.

## Checklist de Segurança

- Trocar `JWT_SECRET` padrão por segredo longo e aleatório.
- Não expor o serviço back-end diretamente ao usuário final quando usar domínio único.
- Usar HTTPS.
- Usar Secret Manager para segredos.
- Definir `TYPEORM_SYNCHRONIZE=false` em produção e usar migrations.
- Manter rate limit ativo.
- Manter PostgreSQL sem IP público, quando possível.
- Criar usuário de banco com privilégio mínimo para a aplicação.

