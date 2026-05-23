#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:?Set PROJECT_ID}"
REGION="${REGION:-southamerica-east1}"
REPOSITORY="${REPOSITORY:-momesso}"
DOMAIN="${DOMAIN:-}"
DB_INSTANCE="${DB_INSTANCE:-momesso-postgres}"
DB_NAME="${DB_NAME:-momesso}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD_SECRET="${DB_PASSWORD_SECRET:-momesso-db-password}"
JWT_SECRET_NAME="${JWT_SECRET_NAME:-momesso-jwt-secret}"

BACKEND_IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/momesso-backend:latest"
FRONTEND_IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/momesso-frontend:latest"

command -v gcloud >/dev/null || {
  echo "gcloud nao encontrado. Instale o Google Cloud SDK antes de continuar." >&2
  exit 1
}

command -v docker >/dev/null || {
  echo "docker nao encontrado. Instale o Docker antes de continuar." >&2
  exit 1
}

gcloud config set project "$PROJECT_ID"
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com

gcloud artifacts repositories describe "$REPOSITORY" --location="$REGION" >/dev/null 2>&1 || \
  gcloud artifacts repositories create "$REPOSITORY" \
    --repository-format=docker \
    --location="$REGION"

gcloud auth configure-docker "$REGION-docker.pkg.dev" --quiet

docker build -t "$BACKEND_IMAGE" ./backend
docker build -t "$FRONTEND_IMAGE" ./frontend

docker push "$BACKEND_IMAGE"
docker push "$FRONTEND_IMAGE"

gcloud sql instances describe "$DB_INSTANCE" >/dev/null 2>&1 || \
  gcloud sql instances create "$DB_INSTANCE" \
    --database-version=POSTGRES_16 \
    --cpu=1 \
    --memory=3840MiB \
    --region="$REGION"

gcloud sql databases describe "$DB_NAME" --instance="$DB_INSTANCE" >/dev/null 2>&1 || \
  gcloud sql databases create "$DB_NAME" --instance="$DB_INSTANCE"

INSTANCE_CONNECTION_NAME="$(gcloud sql instances describe "$DB_INSTANCE" --format='value(connectionName)')"

if ! gcloud secrets describe "$DB_PASSWORD_SECRET" >/dev/null 2>&1; then
  echo "Crie o segredo $DB_PASSWORD_SECRET antes de continuar:"
  echo "printf 'senha-forte' | gcloud secrets create $DB_PASSWORD_SECRET --data-file=-"
  exit 1
fi

if ! gcloud secrets describe "$JWT_SECRET_NAME" >/dev/null 2>&1; then
  echo "Crie o segredo $JWT_SECRET_NAME antes de continuar:"
  echo "printf 'jwt-secret-longo' | gcloud secrets create $JWT_SECRET_NAME --data-file=-"
  exit 1
fi

gcloud run deploy momesso-backend \
  --image="$BACKEND_IMAGE" \
  --region="$REGION" \
  --allow-unauthenticated \
  --add-cloudsql-instances="$INSTANCE_CONNECTION_NAME" \
  --set-env-vars="NODE_ENV=production,PORT=3000,DATABASE_HOST=/cloudsql/$INSTANCE_CONNECTION_NAME,DATABASE_PORT=5432,DATABASE_USER=$DB_USER,DATABASE_NAME=$DB_NAME,TYPEORM_SYNCHRONIZE=false,RATE_LIMIT_TTL_MS=60000,RATE_LIMIT_MAX=100" \
  --set-secrets="DATABASE_PASSWORD=$DB_PASSWORD_SECRET:latest,JWT_SECRET=$JWT_SECRET_NAME:latest"

gcloud run deploy momesso-frontend \
  --image="$FRONTEND_IMAGE" \
  --region="$REGION" \
  --allow-unauthenticated

if [[ -n "$DOMAIN" ]]; then
  gcloud run domain-mappings create \
    --service=momesso-frontend \
    --domain="$DOMAIN" \
    --region="$REGION" || true

  echo "Configure no DNS do seu dominio os registros indicados pelo comando:"
  gcloud run domain-mappings describe "$DOMAIN" --region="$REGION"
fi

echo "Deploy finalizado."
echo "Backend:  $(gcloud run services describe momesso-backend --region="$REGION" --format='value(status.url)')"
echo "Frontend: $(gcloud run services describe momesso-frontend --region="$REGION" --format='value(status.url)')"
