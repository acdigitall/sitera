import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { GroupEntity } from '../groups/group.entity';
import { UserEntity } from '../users/user.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST') || process.env.DB_HOST || 'localhost',
        port: Number(config.get<number>('DB_PORT') || process.env.DB_PORT || 5432),
        username: config.get<string>('DB_USER') || process.env.DB_USER || process.env.USER || 'cagataydalaman',
        password: config.get<string>('DB_PASSWORD') || process.env.DB_PASSWORD || undefined,
        database: config.get<string>('DB_NAME') || process.env.DB_NAME || 'sitera_db',
        entities: [GroupEntity, UserEntity],
        synchronize: true, // Auto-create tables in development
        logging: false,
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule implements OnModuleInit {
  private readonly logger = new Logger(DatabaseModule.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    try {
      this.logger.log('PostgreSQL bağlantısı kuruldu. RLS (Row Level Security) politikaları yapılandırılıyor...');
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();

      try {
        // Enable UUID extension if available
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

        // Check if users table exists before enabling RLS
        const tableExists = await queryRunner.hasTable('users');
        if (tableExists) {
          // Enable and force Row Level Security on users table
          await queryRunner.query(`ALTER TABLE users ENABLE ROW LEVEL SECURITY;`);
          await queryRunner.query(`ALTER TABLE users FORCE ROW LEVEL SECURITY;`);

          // Drop existing policy if any and recreate
          await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_policy ON users;`);
          await queryRunner.query(`
            CREATE POLICY tenant_isolation_policy ON users
            FOR ALL
            USING (
              group_id = NULLIF(current_setting('app.current_group_id', true), '')::uuid
              OR current_setting('app.current_group_id', true) = 'bypass_rls'
            )
            WITH CHECK (
              group_id = NULLIF(current_setting('app.current_group_id', true), '')::uuid
              OR current_setting('app.current_group_id', true) = 'bypass_rls'
            );
          `);

          this.logger.log('✅ PostgreSQL RLS (Row Level Security) politikaları başarıyla uygulandı.');
        }
      } finally {
        await queryRunner.release();
      }
    } catch (err: any) {
      this.logger.warn(`RLS konfigürasyonu sırasında uyarı (veritabanı henüz hazır olmayabilir): ${err.message}`);
    }
  }
}
