import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('legal_documents')
export class LegalDocumentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  type!: 'terms' | 'kvkk';

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'varchar', length: 50, default: 'v1.0' })
  version!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;
}
