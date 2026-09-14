import { MigrationInterface, QueryRunner } from 'typeorm';

export class BaselineSchema1700000000000 implements MigrationInterface {
  name = 'BaselineSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Ensure uuid-ossp extension is enabled
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // 2. Add baseline metadata comment to confirm migration history
    await queryRunner.query(`
      COMMENT ON SCHEMA public IS 'Sitera Enterprise Multi-Tenant Schema - Managed via TypeORM Migrations';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      COMMENT ON SCHEMA public IS NULL;
    `);
  }
}
