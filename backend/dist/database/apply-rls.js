"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const dotenv_1 = require("dotenv");
const typeorm_1 = require("typeorm");
(0, dotenv_1.config)();
async function bootstrap() {
    const dataSource = new typeorm_1.DataSource({
        type: 'postgres',
        host: process.env.DATABASE_HOST ?? 'localhost',
        port: Number(process.env.DATABASE_PORT ?? 5432),
        username: process.env.DATABASE_USER ?? 'postgres',
        password: process.env.DATABASE_PASSWORD ?? 'postgres',
        database: process.env.DATABASE_NAME ?? 'momesso',
    });
    await dataSource.initialize();
    const sql = (0, node_fs_1.readFileSync)((0, node_path_1.join)(process.cwd(), 'database', 'rls-policies.sql'), 'utf8');
    await dataSource.query(sql);
    await dataSource.destroy();
}
void bootstrap();
//# sourceMappingURL=apply-rls.js.map