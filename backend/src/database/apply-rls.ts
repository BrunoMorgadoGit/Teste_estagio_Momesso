import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();

async function bootstrap() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT ?? 5432),
    username: process.env.DATABASE_USER ?? 'postgres',
    password: process.env.DATABASE_PASSWORD ?? 'postgres',
    database: process.env.DATABASE_NAME ?? 'momesso',
  });

  await dataSource.initialize();

  const sql = readFileSync(
    join(process.cwd(), 'database', 'rls-policies.sql'),
    'utf8',
  );
  await dataSource.query(sql);

  await dataSource.destroy();
}

void bootstrap();
